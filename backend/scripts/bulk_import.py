import argparse
import csv
import os
import sys
import uuid

import bcrypt
import psycopg2
from dotenv import load_dotenv


REQUIRED_USER_FIELDS = ["alias", "first_name", "last_name", "role", "pin"]
VALID_ROLES = {"student", "mentor", "coach"}


def load_env():
    load_dotenv()


def get_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "robotics_attendance"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5,
    )
    return conn


def hash_pin(pin: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pin.encode("utf-8"), salt).decode("utf-8")


def validate_row(row: dict):
    for field in REQUIRED_USER_FIELDS:
        if not row.get(field):
            raise ValueError(f"Missing required field: {field}")
    role = row.get("role", "").lower()
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of {sorted(VALID_ROLES)}")


def upsert_user(cur, row: dict):
    alias = row["alias"].strip()
    validate_row(row)

    cur.execute("SELECT id FROM users WHERE alias = %s", (alias,))
    existing = cur.fetchone()

    pin_hash = hash_pin(row["pin"].strip()) if row.get("pin") else None
    user_id = existing[0] if existing else str(uuid.uuid4())

    if existing:
        # Update existing user
        cur.execute(
            """
            UPDATE users
            SET first_name = %s,
                middle_name = %s,
                last_name = %s,
                role = %s,
                is_active = true,
                updated_at = CURRENT_TIMESTAMP,
                pin_hash = COALESCE(%s, pin_hash)
            WHERE id = %s
            RETURNING id
            """,
            (
                row.get("first_name"),
                row.get("middle_name") or None,
                row.get("last_name"),
                row.get("role").lower(),
                pin_hash,
                user_id,
            ),
        )
        return user_id, "updated"
    else:
        if not pin_hash:
            raise ValueError("Pin is required for new users")
        cur.execute(
            """
            INSERT INTO users (id, first_name, middle_name, last_name, alias, role, pin_hash, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, true)
            RETURNING id
            """,
            (
                user_id,
                row.get("first_name"),
                row.get("middle_name") or None,
                row.get("last_name"),
                alias,
                row.get("role").lower(),
                pin_hash,
            ),
        )
        return user_id, "inserted"


def upsert_parent_contact(cur, user_id: str, row: dict):
    name = (row.get("parent_name") or "").strip()
    phone = (row.get("parent_phone") or "").strip()
    relationship = (row.get("parent_relationship") or "").strip() or None

    if not name or not phone:
        return None, "skipped"

    cur.execute(
        "SELECT id FROM parent_contacts WHERE user_id = %s AND phone_number = %s",
        (user_id, phone),
    )
    existing = cur.fetchone()

    if existing:
        cur.execute(
            """
            UPDATE parent_contacts
            SET name = %s,
                relationship = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id
            """,
            (name, relationship, existing[0]),
        )
        return existing[0], "updated"
    else:
        contact_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO parent_contacts (id, user_id, name, phone_number, relationship)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (contact_id, user_id, name, phone, relationship),
        )
        return contact_id, "inserted"


def process_csv(path: str, dry_run: bool = False):
    load_env()
    conn = get_connection()
    summary = {"users_inserted": 0, "users_updated": 0, "contacts_inserted": 0, "contacts_updated": 0, "contacts_skipped": 0, "rows_processed": 0, "rows_failed": 0}

    with conn:
        with conn.cursor() as cur:
            with open(path, newline="", encoding="utf-8") as csvfile:
                reader = csv.DictReader(csvfile)
                for idx, row in enumerate(reader, start=1):
                    try:
                        user_id, status = upsert_user(cur, row)
                        summary[f"users_{status}"] += 1
                        contact_id, c_status = upsert_parent_contact(cur, user_id, row)
                        if c_status == "inserted":
                            summary["contacts_inserted"] += 1
                        elif c_status == "updated":
                            summary["contacts_updated"] += 1
                        else:
                            summary["contacts_skipped"] += 1
                        summary["rows_processed"] += 1
                    except Exception as exc:
                        summary["rows_failed"] += 1
                        print(f"Row {idx} failed: {exc}", file=sys.stderr)
            if dry_run:
                conn.rollback()
                print("Dry run complete; no changes committed.")
            else:
                conn.commit()

    return summary


def main():
    parser = argparse.ArgumentParser(description="Bulk import users and parent contacts from CSV")
    parser.add_argument("csv_path", help="Path to CSV file")
    parser.add_argument("--dry-run", action="store_true", help="Validate without committing changes")
    args = parser.parse_args()

    summary = process_csv(args.csv_path, dry_run=args.dry_run)
    print("\nImport summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
