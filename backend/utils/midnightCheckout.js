const AttendanceSession = require('../models/AttendanceSession');
const Reflection = require('../models/Reflection');
const AuditLog = require('../models/AuditLog');

/**
 * Check out all active sessions at 2 AM and set checkout to 1 hour after check-in
 */
async function processMidnightCheckout() {
  try {
    console.log('Running 2 AM auto-checkout process...');
    
    // Get all active sessions (no checkout time)
    const activeSessions = await AttendanceSession.getActiveSessions();
    
    if (activeSessions.length === 0) {
      console.log('No active sessions to check out.');
      return;
    }
    
    console.log(`Found ${activeSessions.length} active session(s) to check out.`);
    
    for (const session of activeSessions) {
      // Set checkout time to 1 hour after check-in
      const checkInTime = new Date(session.check_in_time);
      const checkoutTime = new Date(checkInTime);
      checkoutTime.setHours(checkoutTime.getHours() + 1);
      
      // Update session with forced checkout time
      await AttendanceSession.update(session.id, {
        checkOutTime: checkoutTime.toISOString(),
      });
      
      // Create a reflection indicating forced checkout
      await Reflection.create({
        attendanceId: session.id,
        userId: session.user_id,
        text: 'SYSTEM AUTO-CHECKOUT: User failed to check out properly and was automatically checked out at 2 AM with 1 hour of attendance credit.',
      });
      
      // Create audit log entry
      await AuditLog.create({
        actorUserId: null, // System action
        actionType: 'FORCED_CHECKOUT',
        targetUserId: session.user_id,
        details: {
          sessionId: session.id,
          checkoutTime: checkoutTime.toISOString(),
          reason: '2 AM auto-checkout (1 hour credit)',
        },
      });
      
      console.log(`✓ Checked out user ${session.user_id} (session ${session.id})`);
    }
    
    console.log(`2 AM auto-checkout completed. Checked out ${activeSessions.length} user(s).`);
  } catch (error) {
    console.error('Error during 2 AM checkout process:', error);
    throw error;
  }
}

module.exports = { processMidnightCheckout };
