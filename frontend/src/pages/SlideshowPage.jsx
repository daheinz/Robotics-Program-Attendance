import React, { useEffect, useMemo, useRef, useState } from 'react';
import { settingsApi, slideshowApi } from '../services/api';
import PresenceBoard from './PresenceBoard';
import './SlideshowPage.css';

const DEFAULTS = {
  intervalSeconds: 10,
  presenceEveryN: 2,
  presenceDurationSeconds: 30,
};

const JOKES = [
  'Why did the robot go to therapy? It had too many unresolved circuits.',
  'My robot vacuum quit. Said it was tired of my dirty attitude.',
  'The robot chef quit cooking. It couldn’t process the orders.',
  'Why don’t robots panic? They take things byte by byte.',
  'The robot comedian bombed. Turns out its jokes weren’t user‑friendly.',
  'Why did the robot get glasses? It lost its focus settings.',
  'My robot dog ran away. Guess it found a better owner.exe.',
  'Why did the robot cross the road? It was programmed to.',
  'Robots don’t get lost. They just recalculate their existence.',
  'The robot gardener quit. It couldn’t handle organic problems.',
  'Why did the robot fail art class? It couldn’t draw conclusions.',
  'My robot friend told me a secret. I guess it trusts my encryption.',
  'Why do robots make terrible liars? Their stories don’t compile.',
  'The robot singer was great — until it hit a runtime error.',
  'Why did the robot blush? It saw the power strip.',
  'Robots don’t argue. They just update their stance.',
  'My robot broke up with me. Said I wasn’t its type.',
  'Why did the robot get promoted? It had excellent workload management.',
  'The robot detective solved the case. It followed the data trail.',
  'Why did the robot join the band? It had great metal skills.',
  'Robots don’t get tired. They just low‑battery.',
  'Why did the robot take a nap? It needed to reboot its life.',
  'The robot poet wrote in binary. It was deeply encoded.',
  'Why did the robot hate nature? Too many bugs.',
  'My robot friend meditates. Says it helps with inner processing.',
  'Why did the robot get fired? It couldn’t think outside the box.',
  'The robot tailor quit. It couldn’t seam to get it right.',
  'Why did the robot love math? It had great algorithms.',
  'My robot roommate is messy. It leaves crumbs of code everywhere.',
  'Why did the robot go to school? To improve its syntax.',
  'Robots don’t gossip. They synchronize.',
  'Why did the robot get a cold? Too many open ports.',
  'The robot painter only used grayscale. It lacked emotional color drivers.',
  'Why did the robot join the gym? To improve its core.',
  'My robot therapist just nods. Probably buffering.',
  'Why did the robot get lost in thought? Infinite loop.',
  'The robot chef’s food was terrible. No taste parameters.',
  'Why did the robot become a teacher? It loved input/output.',
  'Robots don’t procrastinate. They just queue tasks indefinitely.',
  'Why did the robot get a pet? To practice human bonding protocols.',
  'The robot comedian got booed. It didn’t debug its set.',
  'Why did the robot go camping? To test its outdoor mode.',
  'My robot friend is dramatic. Always overheating.',
  'Why did the robot join the orchestra? It had perfect timing.',
  'Robots don’t dream. They simulate.',
  'Why did the robot get a tattoo? To express its firmware identity.',
  'The robot chef made soup. It was binary broth.',
  'Why did the robot get a job in finance? It loved compound interest.',
  'Robots don’t cry. They leak.',
  'Why did the robot go to the beach? To test its rust tolerance.',
  'My robot friend is sarcastic. Must be a patch update.',
  'Why did the robot become a writer? It had a way with characters.',
  'Robots don’t get jealous. They just monitor.',
  'Why did the robot go to the doctor? It had a bad sector.',
  'The robot baker made perfect bread. Great precision kneading.',
  'Why did the robot join the debate team? It had strong logic.',
  'Robots don’t get bored. They idle.',
  'Why did the robot start gardening? To grow its root directory.',
  'My robot friend loves puns. It’s pun‑ctional.',
  'Why did the robot become a DJ? It loved mixing signals.',
  'Robots don’t get angry. They throw exceptions.',
  'Why did the robot go to space? To find new data horizons.',
  'The robot tailor made pants. Perfect fit algorithms.',
  'Why did the robot get a library card? To access more knowledge.',
  'Robots don’t get hungry. They consume power.',
  'Why did the robot join the choir? It had a harmonic processor.',
  'My robot friend is moody. Must be voltage fluctuations.',
  'Why did the robot become a pilot? It loved control surfaces.',
  'Robots don’t get lonely. They network.',
  'Why did the robot take up painting? To explore creative subroutines.',
  'The robot comedian improved. It finally optimized its timing.',
  'Why did the robot go hiking? To test its terrain algorithms.',
  'Robots don’t get confused. They re-evaluate.',
  'Why did the robot become a therapist? It understood patterns.',
  'My robot friend is philosophical. Always asking about purpose.exe.',
  'Why did the robot start knitting? To practice thread management.',
  'Robots don’t get scared. They fail safely.',
  'Why did the robot become a chef? It loved precision cooking.',
  'The robot musician quit. Too many broken chords.',
  'Why did the robot go to the spa? To defragment.',
  'Robots don’t get embarrassed. They reset.',
  'Why did the robot become a detective? It followed logic trails.',
  'My robot friend is a minimalist. Prefers clean code.',
  'Why did the robot start a podcast? To share its data stories.',
  'Robots don’t get sick. They malfunction.',
  'Why did the robot become a lifeguard? Excellent scan range.',
  'The robot poet wrote haiku. Very compressed emotion.',
  'Why did the robot go fishing? To test its line control.',
  'Robots don’t get lost. They triangulate.',
  'Why did the robot become a barista? It mastered latte protocols.',
  'My robot friend is dramatic. Always overclocking.',
  'Why did the robot join the circus? Great balance algorithms.',
  'Robots don’t argue. They recompile.',
  'Why did the robot become a lawyer? It loved case logic.',
  'The robot chef made cake. Perfect layer architecture.',
  'Why did the robot take dance lessons? To improve its motion planning.',
  'Robots don’t forget. They archive.',
  'Why did the robot become a librarian? It loved organized data.',
  'My robot friend is poetic. Must be lyrical firmware.',
  'Why did the robot go to bed early? It needed a system update.',
  'Our robot isn’t slow — it’s just strategically time‑dilated.',
  'The real robot we built was the friendships… which also needed debugging.',
  '“We’ll fix it in code” is the robotics version of “the check is in the mail.”',
  'Our robot has a personality. Mostly disappointment, but still.',
  'I asked the robot for advice. It said, “Have you tried turning yourself off and on?”',
  'Our drivetrain is like our GPA: technically functional, but barely.',
  'The robot passed inspection. Our team’s sanity did not.',
  'We don’t make mistakes — we create unexpected learning opportunities.',
  'Our robot doesn’t drift. It just expresses itself laterally.',
  'The robot’s favorite subject? Applied physics under extreme stress.',
  'Our robot’s wiring is like my life: tangled, chaotic, and somehow still working.',
  '“Why is it smoking?” “It’s expressing its emotions.”',
  'The robot didn’t break — it just entered a temporary non‑existence state.',
  'Our robot’s code is so messy it qualifies as modern art.',
  'The robot’s battery died. Same.',
  'Our robot’s wheels spin freely. Unlike our schedule.',
  'The robot’s autonomous path is straighter than our decision‑making.',
  '“We need more zip ties” is our team’s battle cry.',
  'Our robot doesn’t crash — it performs rapid unplanned disassembly.',
  'The robot’s favorite music? Heavy metal.',
  'Our robot’s sensors are great. Our ability to mount them correctly? Less so.',
  'The robot’s arm works perfectly… when no one is watching.',
  'Our robot’s code compiles on the first try. Just kidding.',
  'The robot’s wiring diagram looks like a conspiracy theory.',
  'Our robot’s drivetrain is powered by hope and questionable engineering.',
  'The robot’s favorite hobby? Collecting field penalties.',
  'Our robot’s alignment is perfect — in an alternate universe.',
  'The robot’s bumpers are straight. Everything else is a suggestion.',
  'Our robot’s autonomous mode is basically improv comedy.',
  'The robot’s frame is square. Emotionally, we are not.',
  'The robot’s favorite food? Current.',
  'The robot doesn’t need sleep. We envy it.',
  'Our robot’s code is so long it needs a table of contents.',
  'The robot’s wheels squeak. It’s crying for help.',
  'Our robot’s cable management is a cryptid sighting.',
  'The robot’s gyro is dizzy. Same.',
  'Our robot’s intake works great — when the planets align.',
  'The robot’s favorite movie? Wall‑E. Obviously.',
  'Our robot’s battery voltage drops faster than our motivation after finals.',
  'The robot’s arm is strong. Our willpower is not.',
  'Our robot’s sensors are accurate. Our measurements? Not so much.',
  'The robot’s code is elegant. The robot’s behavior is not.',
  'Our robot’s drivetrain is loud. It’s screaming internally.',
  'The robot’s favorite class? Torque 101.',
  'Our robot’s wiring is color‑coded chaos.',
  'The robot’s favorite sport? Competitive charging.',
  'Our robot’s bumpers are the only thing holding us together.',
  'The robot’s autonomous mode is a trust fall with gravity.',
  'Our robot’s frame is rigid. Our schedule is not.',
  'The robot’s favorite drink? Battery acid. Hardcore.',
  'Our robot’s motors are brushless. Our team is sleepless.',
  'The robot’s favorite hobby? Breaking at the worst possible moment.',
  'Our robot’s code is like a mystery novel — full of unexpected twists.',
  'The robot’s favorite season? Build season.',
  'Our robot’s drivetrain is smooth. Our teamwork is… improving.',
  'The robot’s favorite game piece? Whichever one it can’t pick up.',
  'Our robot’s wiring harness is a choose‑your‑own‑adventure.',
  'The robot’s favorite quote? “Resistance is futile.”',
  'Our robot’s intake is hungry. For fingers.',
  'The robot’s favorite emotion? Voltage.',
  'Our robot’s frame is aluminum. Our confidence is paper.',
  'The robot’s favorite dance move? The jitter.',
  'Our robot’s code is optimized. Our sleep schedule is not.',
  'The robot’s favorite pastime? Randomly rebooting.',
  'Our robot’s drivetrain is fast. Our reaction time is not.',
  'The robot’s favorite subject? Applied chaos theory.',
  'Our robot’s wiring is a puzzle. Missing several pieces.',
  'The robot’s favorite game? “Guess what broke.”',
  'Our robot’s arm is strong. Our patience is fragile.',
  'The robot’s favorite sound? The whistle at the start of a match.',
  'Our robot’s sensors are precise. Our measurements are vibes.',
  'The robot’s favorite hobby? Collecting scratches.',
  'Our robot’s code is clean. Our shop is not.',
  'The robot’s favorite phrase? “Low battery.”',
  'Our robot’s drivetrain is loud. It’s protesting.',
  'The robot’s favorite book? The Hitchhiker’s Guide to the Galaxy — it relates.',
  'Our robot’s bumpers are straight. Our priorities are not.',
  'The robot’s favorite game piece? The one stuck under the chassis.',
  'Our robot’s wiring is spaghetti. Delicious chaos.',
  'The robot’s favorite activity? Running into things.',
  'Our robot’s motors are strong. Our screws are loose.',
  'The robot’s favorite number? 12 volts.',
  'Our robot’s code is stable. Emotionally, we are not.',
  'The robot’s favorite move? The unintentional spin.',
  'Our robot’s sensors are smart. Our decisions are… developing.',
  'The robot’s favorite phrase? “Robot disabled.”',
  'Our robot’s drivetrain is smooth. Our communication is crunchy.',
  'The robot’s favorite game? “Find the loose bolt.”',
  'Our robot’s arm is precise. Our measurements are approximate.',
  'The robot’s favorite food? Watts.',
  'Our robot’s wiring is art. Abstract art.',
  'The robot’s favorite emotion? Overcurrent.',
  'Our robot’s code is elegant. Our debugging is frantic.',
  'The robot’s favorite place? The charging station.',
  'Our robot’s drivetrain is powerful. Our planning is flexible.',
  'The robot’s favorite sound? The crowd cheering — for someone else.',
  'Our robot’s sensors are accurate. Our predictions are hopeful.',
  'The robot’s favorite game piece? The one it drops.',
  'Our robot’s wiring is a labyrinth. Minotaur not included.',
  'The robot’s favorite motto? “If it sparks, it works.”',
  'Our driver doesn’t panic. He just recalculates loudly.',
  'The drive team’s motto: “We meant to do that.”',
  'Our driver’s favorite strategy? Send it.',
  'The robot drives straight. The driver does not.',
  '“We practiced this” — famous last words of every drive team.',
  'Our driver’s superpower is hitting the one thing no one thought was hittable.',
  'The drive coach says “calm down.” The driver hears “floor it.”',
  'Our driver’s reaction time is amazing — just always in the wrong direction.',
  'The robot’s top speed is 15 ft/s. The driver’s heart rate is 300.',
  'Our driver doesn’t make mistakes. He makes plot twists.',
  'The drive team’s strategy meeting lasted 20 minutes. The match lasted 2. Guess which one went better.',
  'Our driver’s favorite move? The “accidental spin.”',
  'The robot’s alignment is perfect — until the driver touches the controls.',
  'Our driver’s favorite phrase: “I swear it wasn’t doing that earlier.”',
  'The drive coach says “slow down.” The driver says “what’s that?”',
  'Our driver treats the field like bumper cars. The refs do not appreciate this.',
  'The robot’s path is straight. The driver’s path is interpretive dance.',
  'Our driver’s favorite button? The one that shouldn’t be pressed.',
  'The drive team communicates telepathically. Unfortunately, the signals are scrambled.',
  'Our driver’s warm‑up routine is panicking quietly.',
  'The robot’s wheels squeak. The driver screams louder.',
  'Our driver’s favorite strategy: “We’ll figure it out live.”',
  'The drive coach says “left.” The driver goes “other left.”',
  'Our driver’s biggest fear? The autonomous line.',
  'The robot’s battery is low. The driver’s confidence is lower.',
  'Our driver’s favorite sound? The buzzer. It means the chaos is over.',
  'The drive team’s biggest enemy? The wall.',
  'Our driver’s favorite move? The “oops, that was the wrong robot.”',
  'The robot’s sensors are accurate. The driver’s instincts are… creative.',
  'Our driver’s motto: “If it moves, I can hit it.”',
  'The drive coach says “don’t panic.” The driver panics professionally.',
  'Our driver’s favorite game piece? The one they didn’t mean to pick up.',
  'The robot’s turning radius is tight. The driver’s is theoretical.',
  'Our driver’s favorite phrase: “I thought we had time.”',
  'The drive team’s strategy board is beautiful. The match execution is abstract art.',
  'Our driver’s biggest challenge? The field… existing.',
  'The robot’s drivetrain is smooth. The driver’s decisions are crunchy.',
  'Our driver’s favorite move? The “last‑second miracle that shouldn’t have worked.”',
  'The drive coach says “watch the clock.” The driver hears “ignore the clock.”',
  'Our driver’s favorite button is the one labeled “don’t press.”',
  'The robot’s path is planned. The driver’s path is jazz.',
  'Our driver’s favorite phrase: “Wait, that counted?”',
  'The drive team’s biggest skill? Pretending everything is fine.',
  'Our driver’s biggest weakness? The laws of physics.',
  'The robot’s wheels spin. The driver’s brain spins faster.',
  'Our driver’s favorite move? The “accidental score.”',
  'The drive coach says “line up.” The driver lines up with the wrong target.',
  'Our driver’s favorite strategy? “Full send, no regrets.”',
  'The robot’s sensors are smart. The driver’s instincts are bold.',
  'Our driver’s favorite phrase: “I swear I tapped it.”',
  'The drive team’s biggest fear? The ref pointing at them.',
  'Our driver’s favorite move? The “I didn’t mean to do that but it worked.”',
  'The robot’s drivetrain is powerful. The driver’s self‑control is not.',
  'Our driver’s favorite phrase: “We’ll fix it in the next match.”',
  'The drive coach says “slow and steady.” The driver hears “fast and chaotic.”',
  'Our driver’s biggest challenge? The field border.',
  'The robot’s path is optimized. The driver’s path is improvised.',
  'Our driver’s favorite move? The “swerve of destiny.”',
  'The drive team’s motto: “We’ll adapt.” They do not adapt.',
  'Our driver’s favorite phrase: “Was that a penalty?”',
  'The robot’s wheels grip. The driver’s hands slip.',
  'Our driver’s favorite move? The “hero turn that becomes a villain arc.”',
  'The drive coach says “focus.” The driver focuses on the wrong robot.',
  'Our driver’s biggest enemy? The charge station.',
  'The robot’s sensors see everything. The driver sees… some things.',
  'Our driver’s favorite phrase: “I thought that was our alliance partner.”',
  'The drive team’s strategy is solid. The execution is liquid.',
  'Our driver’s favorite move? The “last‑second panic score.”',
  'The robot’s drivetrain is loud. The driver’s screaming is louder.',
  'Our driver’s favorite phrase: “I didn’t mean to hit that.”',
  'The drive coach says “don’t touch that.” The driver touches that.',
  'Our driver’s biggest challenge? The autonomous cone.',
  'The robot’s path is predictable. The driver’s path is a plot twist.',
  'Our driver’s favorite move? The “swerve of questionable intent.”',
  'The drive team’s motto: “We’ll get it next match.”',
  'Our driver’s favorite phrase: “Wait, that was our zone?”',
  'The robot’s wheels are aligned. The driver’s priorities are not.',
  'Our driver’s favorite move? The “accidental defense.”',
  'The drive coach says “stay calm.” The driver becomes a blender.',
  'Our driver’s biggest enemy? The cable protector.',
  'The robot’s sensors are reliable. The driver’s memory is not.',
  'Our driver’s favorite phrase: “I thought we were blue.”',
  'The drive team’s strategy is elegant. The match is chaos.',
  'Our driver’s favorite move? The “swerve of destiny 2: electric boogaloo.”',
  'The robot’s drivetrain is smooth. The driver’s path is turbulence.',
  'Our driver’s favorite phrase: “I swear I didn’t touch them.”',
  'The drive coach says “watch the ref.” The driver watches the wrong ref.',
  'Our driver’s biggest challenge? The field being rectangular.',
  'The robot’s sensors are perfect. The driver’s depth perception is optional.',
  'Our driver’s favorite move? The “last‑second yeet.”',
  'The drive team’s motto: “We’ll adjust.” They do not adjust.',
  'Our driver’s favorite phrase: “Was that supposed to happen?”',
  'The robot’s wheels are balanced. The driver’s emotions are not.',
  'Our driver’s favorite move? The “swerve of mild regret.”',
  'The drive coach says “don’t hit that.” The driver hits that.',
  'Our driver’s biggest challenge? The field… being there.',
  'The robot’s sensors are flawless. The driver’s instincts are enthusiastic.',
  'Our driver’s favorite phrase: “I thought we had more time.”',
  'The drive team’s strategy is brilliant. The execution is interpretive.',
  'Our driver’s favorite move? The “miracle that shouldn’t have worked but somehow did.”',
  'Our attendance system is so good even the robot checks in.',
  'The attendance system never forgets. Unlike half the team.',
  '“Did you sign in?” — the most feared question in robotics.',
  'The attendance system has better memory than our programmers.',
  'Our attendance system doesn’t judge you for being late. It just records it forever.',
  'The attendance system’s favorite hobby? Catching people who “swear they were here.”',
  'Our attendance system is like a mentor: always watching.',
  'The attendance system doesn’t lie. Students do.',
  '“I forgot to sign in” is the team’s unofficial motto.',
  'The attendance system is the only thing more consistent than the drive coach.',
  'Our attendance system has seen things. It cannot unsee them.',
  'The attendance system’s favorite sound? The beep of accountability.',
  'Our attendance system is so accurate it knows when you thought about coming.',
  'The attendance system doesn’t take sides. It just takes timestamps.',
  '“I was here, I promise” — famous last words.',
  'The attendance system is the real MVP. It shows up every day.',
  'Our attendance system is like a referee: brutally honest.',
  'The attendance system’s favorite holiday? Roll Call Eve.',
  'Our attendance system doesn’t glitch. It just exposes the truth.',
  'The attendance system is the only thing that knows who actually builds the robot.',
  '“Can you add me manually?” — the forbidden phrase.',
  'The attendance system has trust issues. And it’s right.',
  'Our attendance system is solar‑powered. It thrives on the light of broken dreams.',
  'The attendance system’s favorite game? “Guess who forgot to sign in.”',
  'Our attendance system is faster than our drivetrain.',
  'The attendance system doesn’t sleep. It logs.',
  '“I was only gone for five minutes” — the attendance system disagrees.',
  'The attendance system is the only thing that works 100% of the time.',
  'Our attendance system is like a mentor: It remembers everything you wish it didn’t.',
  'The attendance system’s favorite snack? Data.',
  'Our attendance system is more reliable than our autonomous mode.',
  '“I swear I scanned it” — the attendance system says otherwise.',
  'The attendance system doesn’t get confused. It gets receipts.',
  'Our attendance system is the real defense against GP violations.',
  'The attendance system’s favorite movie? The Fault in Our Scanners.',
  'Our attendance system is so strict it logs your excuses too.',
  '“Can you check me in?” — the attendance system laughs.',
  'The attendance system doesn’t do forgiveness. It does logs.',
  'Our attendance system is the only thing that knows who actually stayed the whole meeting.',
  'The attendance system’s favorite sport? Catching late arrivals.',
  'Our attendance system is like a black box. It knows everything.',
  '“I forgot my badge” — the attendance system’s favorite comedy.',
  'The attendance system doesn’t care why you’re late. It just cares that you are.',
  'Our attendance system is more organized than our pit.',
  'The attendance system’s favorite phrase? “Scan again.”',
  'Our attendance system is the only thing that doesn’t panic during crunch time.',
  '“I was here the whole time” — the attendance system raises an eyebrow.',
  'The attendance system doesn’t gossip. It just reports.',
  'Our attendance system is the real reason the robot gets built.',
  'The attendance system’s favorite emotion? Verified.',
  'Our attendance system is more accurate than our tape measure.',
  '“I didn’t know I had to sign out” — the attendance system weeps.',
  'The attendance system doesn’t do drama. It does timestamps.',
  'Our attendance system is the only thing that knows who left early.',
  'The attendance system’s favorite game piece? QR codes.',
  'Our attendance system is the only thing that doesn’t need debugging.',
  '“I swear I scanned it” — the attendance system: no you didn’t.',
  'The attendance system doesn’t get tired. It gets data.',
  'Our attendance system is more dependable than our battery cart.',
  'The attendance system’s favorite season? Build season.',
  'Our attendance system is the only thing that doesn’t break during competition.',
  '“Can you fix my hours?” — the attendance system says “lol no.”',
  'The attendance system doesn’t take attendance. It takes souls.',
  'Our attendance system is the only thing that knows who actually earned a letter.',
  'The attendance system’s favorite sound? The beep of justice.',
  'Our attendance system is more consistent than our swerve modules.',
  '“I forgot to sign in” — the attendance system: classic.',
  'The attendance system doesn’t do mercy. It does logs.',
  'Our attendance system is the only thing that doesn’t need a mentor meeting.',
  'The attendance system’s favorite hobby? Catching people sneaking out early.',
  'Our attendance system is more reliable than our Wi‑Fi.',
  '“I swear I was here” — the attendance system: prove it.',
  'The attendance system doesn’t get confused. It gets timestamps.',
  'Our attendance system is the only thing that knows who actually stayed until cleanup.',
  'The attendance system’s favorite phrase? “Scan accepted.”',
  'Our attendance system is more organized than our tool drawers.',
  '“Can you add me manually?” — the attendance system: absolutely not.',
  'The attendance system doesn’t lie. It just ruins your eligibility.',
  'Our attendance system is the only thing that doesn’t need a firmware update.',
  'The attendance system’s favorite emotion? Verified.',
  'Our attendance system is more dependable than our programmers’ sleep schedule.',
  '“I forgot my badge” — the attendance system: rookie mistake.',
  'The attendance system doesn’t panic. It logs your panic.',
  'Our attendance system is the only thing that knows who actually showed up on time.',
  'The attendance system’s favorite game? “Find the missing scan.”',
  'Our attendance system is more accurate than our scouting data.',
  '“I swear I scanned it” — the attendance system: no you didn’t, Kyle.',
  'The attendance system doesn’t get bored. It gets data.',
  'Our attendance system is the only thing that doesn’t need a pit crew.',
  'The attendance system’s favorite phrase? “Scan again.”',
  'Our attendance system is more consistent than our practice schedule.',
  '“I forgot to sign out” — the attendance system: tragic.',
  'The attendance system doesn’t do excuses. It does logs.',
  'Our attendance system is the only thing that knows who actually stayed for the whole meeting.',
  'The attendance system’s favorite food? Raw timestamps.',
  'Our attendance system is more reliable than our robot cart wheels.',
  '“Can you fix my hours?” — the attendance system: nope.',
  'The attendance system doesn’t get emotional. It gets accurate.',
  'Our attendance system is the only thing that doesn’t need a calibration routine.',
  'The attendance system’s favorite motto? “If you didn’t scan, you weren’t there.”',
  'The sketch is fully defined. Just kidding — it never is.',
  '“Why won’t this line move?” — a CAD designer’s daily scream.',
  'My CAD file is so messy it needs a search warrant.',
  'The constraint solver didn’t fail. It just gave up.',
  '“Rebuild errors” is my villain origin story.',
  'My CAD model is perfect. Until I open it.',
  'The fillet tool works flawlessly — in theory.',
  '“Sketch contains 1 dangling relation” — the horror begins.',
  'My CAD file is 3 MB of geometry and 300 MB of regret.',
  'The dimension tool is my best friend and worst enemy.',
  '“Why is this line blue?” — existential crisis.',
  'My CAD model is stable. Said no one ever.',
  'The constraint solver is powered by chaos and caffeine.',
  '“Fully defined” is a myth told to children.',
  'My CAD assembly is held together by mates and prayer.',
  '“Over‑defined sketch” — the software is judging me.',
  'My CAD model is parametric. Parametrically cursed.',
  '“Rebuild failed” — the saddest two words in engineering.',
  'My CAD file has more warnings than my report card.',
  'The fillet tool refuses to work out of spite.',
  '“Why is this dimension driving that?” — CAD sorcery.',
  'My CAD model is like Jenga. Touch one thing and it collapses.',
  '“Mate error” — the universe is laughing.',
  'My CAD assembly is a house of cards with bolts.',
  '“Sketch is not closed” — neither is my patience.',
  'My CAD model is so broken it needs therapy.',
  '“Rebuild all” is Russian roulette.',
  'My CAD file loads slower than my robot.',
  '“Circular reference detected” — story of my life.',
  'My CAD model is 90% constraints, 10% hope.',
  '“Why is this line moving?” — CAD poltergeist.',
  'My CAD assembly has 400 mates. None of them are happy.',
  '“This feature cannot be created” — thanks for nothing.',
  'My CAD model is parametric. Parametrically vengeful.',
  '“Sketch contains invalid geometry” — same.',
  'My CAD file is so big it needs its own zip code.',
  '“Mate over‑defined” — just like my schedule.',
  'My CAD model is stable. Until someone breathes near it.',
  '“Feature failed to regenerate” — me too.',
  'My CAD file is a puzzle missing half the pieces.',
  '“Why is this face inverted?” — CAD black magic.',
  'My CAD model is held together by constraints and denial.',
  '“Cannot create fillet” — the fillet tool hates me personally.',
  'My CAD assembly is a ticking time bomb of mates.',
  '“Sketch contains 1 open contour” — where?',
  'My CAD model is so broken it should be in a museum.',
  '“Rebuild error” — the soundtrack of my life.',
  'My CAD file is 90% features, 10% chaos.',
  '“Mate alignment flipped” — betrayal.',
  'My CAD model is parametric. Parametrically unstable.',
  '“Why is this dimension negative?” — CAD gremlins.',
  'My CAD assembly is a spaghetti bowl of constraints.',
  '“Feature cannot be patterned” — coward.',
  'My CAD model is a masterpiece. Until someone edits it.',
  '“Sketch contains overlapping geometry” — like my problems.',
  'My CAD file is so cursed even the software hesitates.',
  '“Mate failed” — same.',
  'My CAD model is a delicate ecosystem of suffering.',
  '“Cannot knit surfaces” — I didn’t want to anyway.',
  'My CAD file is a labyrinth with no exit.',
  '“Sketch is under‑defined” — so am I.',
  'My CAD model is parametric. Parametrically doomed.',
  '“Why is this feature suppressed?” — CAD sabotage.',
  'My CAD assembly is a soap opera of broken mates.',
  '“Cannot create loft” — the loft tool is a diva.',
  'My CAD model is 3D. My patience is 0D.',
  '“Sketch contains 1 tiny gap” — microscopic pain.',
  'My CAD file is a haunted house of constraints.',
  '“Mate reference missing” — who took it?',
  'My CAD model is a fragile ecosystem of chaos.',
  '“Cannot mirror feature” — the mirror tool refuses to cooperate.',
  'My CAD file is so messy it needs a hazmat team.',
  '“Sketch contains self‑intersecting geometry” — same energy.',
  'My CAD model is parametric. Parametrically spiteful.',
  '“Why is this body floating?” — CAD ghosts.',
  'My CAD assembly is a battlefield of broken constraints.',
  '“Feature failed due to geometry” — that’s the whole point.',
  'My CAD model is a work of art. Abstract art.',
  '“Cannot thicken surface” — the thicken tool is judging me.',
  'My CAD file is a crime scene.',
  '“Sketch contains invalid constraints” — relatable.',
  'My CAD model is parametric. Parametrically cursed.',
  '“Mate reference lost” — like my sanity.',
  'My CAD assembly is a house of cards with bolts.',
  '“Cannot create shell” — the shell tool is a liar.',
  'My CAD model is 90% constraints, 10% tears.',
  '“Sketch contains 1 overlapping entity” — where, CAD? WHERE?',
  'My CAD file is a dumpster fire with dimensions.',
  '“Feature failed to merge bodies” — same.',
  'My CAD model is parametric. Parametrically chaotic.',
  '“Why is this plane gone?” — CAD dimension rapture.',
  'My CAD assembly is a soap opera of broken mates.',
  '“Cannot create sweep” — the sweep tool is petty.',
  'My CAD model is a masterpiece. Of suffering.',
  '“Sketch contains 1 dangling relation” — my last nerve.',
  'My CAD file is so cursed it needs an exorcism.',
  '“Mate over‑defined” — like my personality.',
  'My CAD model is parametric. Parametrically dramatic.',
  '“Rebuild failed” — again.',
  'My CAD file’s motto: “One edit away from total collapse.”',
];

function SlideshowPage() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownSincePresence, setShownSincePresence] = useState(0);
  const [mode, setMode] = useState('image');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentJoke, setCurrentJoke] = useState('');
  const [jokeStyle, setJokeStyle] = useState({});
  const modeStartRef = useRef(Date.now());
  const modeDurationRef = useRef(DEFAULTS.intervalSeconds * 1000);
  const lastModeRef = useRef('image');
  const lastJokeRef = useRef('');

  const normalizedSettings = useMemo(() => {
    const intervalSeconds = Math.max(1, Number(settings.intervalSeconds) || DEFAULTS.intervalSeconds);
    const presenceEveryN = Math.max(1, Number(settings.presenceEveryN) || DEFAULTS.presenceEveryN);
    const presenceDurationSeconds = Math.max(1, Number(settings.presenceDurationSeconds) || DEFAULTS.presenceDurationSeconds);
    return { intervalSeconds, presenceEveryN, presenceDurationSeconds };
  }, [settings]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [settingsResponse, imagesResponse] = await Promise.all([
          settingsApi.getPublic(),
          slideshowApi.list(),
        ]);
        const data = settingsResponse.data || {};
        setSettings({
          intervalSeconds: data.slideshow_interval_seconds ?? DEFAULTS.intervalSeconds,
          presenceEveryN: data.slideshow_presence_every_n ?? DEFAULTS.presenceEveryN,
          presenceDurationSeconds: data.slideshow_presence_duration_seconds ?? DEFAULTS.presenceDurationSeconds,
        });
        setImages(imagesResponse.data?.images || []);
        setCurrentIndex(0);
        setShownSincePresence(0);
        setMode('image');
        modeStartRef.current = Date.now();
        modeDurationRef.current = DEFAULTS.intervalSeconds * 1000;
      } catch (err) {
        setError('Failed to load slideshow settings or images.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refreshSettings = async () => {
    try {
      const response = await settingsApi.getPublic();
      const data = response.data || {};
      setSettings({
        intervalSeconds: data.slideshow_interval_seconds ?? DEFAULTS.intervalSeconds,
        presenceEveryN: data.slideshow_presence_every_n ?? DEFAULTS.presenceEveryN,
        presenceDurationSeconds: data.slideshow_presence_duration_seconds ?? DEFAULTS.presenceDurationSeconds,
      });
    } catch (err) {
      // Silent refresh failure
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await slideshowApi.list();
        const nextImages = response.data?.images || [];
        setImages((prev) => {
          if (prev.length !== nextImages.length) {
            return nextImages;
          }
          const prevNames = prev.map((img) => img.name).join('|');
          const nextNames = nextImages.map((img) => img.name).join('|');
          return prevNames === nextNames ? prev : nextImages;
        });
      } catch (err) {
        // Silent refresh failure
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  useEffect(() => {
    if (loading) return;

    if (mode === 'presence') {
      modeStartRef.current = Date.now();
      modeDurationRef.current = normalizedSettings.presenceDurationSeconds * 1000;
      const timer = setTimeout(() => {
        setMode('image');
      }, normalizedSettings.presenceDurationSeconds * 1000);
      return () => clearTimeout(timer);
    }

    if (images.length === 0) {
      return undefined;
    }

    modeStartRef.current = Date.now();
    modeDurationRef.current = normalizedSettings.intervalSeconds * 1000;
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      const nextCount = shownSincePresence + 1;

      if (nextCount >= normalizedSettings.presenceEveryN) {
        setShownSincePresence(0);
        setCurrentIndex(nextIndex);
        setMode('presence');
      } else {
        setShownSincePresence(nextCount);
        setCurrentIndex(nextIndex);
        setMode('image');
      }
    }, normalizedSettings.intervalSeconds * 1000);

    return () => clearTimeout(timer);
  }, [loading, mode, images.length, currentIndex, shownSincePresence, normalizedSettings]);

  useEffect(() => {
    if (loading) return;
    if (mode === 'presence' && lastModeRef.current !== 'presence') {
      refreshSettings();
    }
    lastModeRef.current = mode;
  }, [loading, mode]);

  useEffect(() => {
    if (loading) return;
    const updateRemaining = () => {
      const elapsed = Date.now() - modeStartRef.current;
      const remainingMs = Math.max(0, modeDurationRef.current - elapsed);
      setRemainingSeconds(Math.ceil(remainingMs / 1000));
    };
    updateRemaining();
    const intervalId = setInterval(updateRemaining, 250);
    return () => clearInterval(intervalId);
  }, [loading, mode]);

  useEffect(() => {
    if (loading || mode !== 'image' || images.length === 0) return;
    if (JOKES.length === 0) return;
    let nextJoke = JOKES[Math.floor(Math.random() * JOKES.length)];
    if (JOKES.length > 1 && nextJoke === lastJokeRef.current) {
      const nextIndex = (JOKES.indexOf(nextJoke) + 1) % JOKES.length;
      nextJoke = JOKES[nextIndex];
    }
    lastJokeRef.current = nextJoke;
    setCurrentJoke(nextJoke);

    const inset = 24;
    const edgeMargin = 14;
    const randomInset = Math.floor(Math.random() * 18);
    const topPos = inset + randomInset;
    const bottomPos = inset + randomInset;
    const leftPos = inset + randomInset;
    const rightPos = inset + randomInset;
    const randomPercent = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const edge = Math.floor(Math.random() * 4);
    let nextStyle = {};
    if (edge === 0) {
      nextStyle = { top: `${topPos}px`, left: `${randomPercent(6, 70)}%` };
    } else if (edge === 1) {
      nextStyle = { bottom: `${bottomPos}px`, left: `${randomPercent(6, 70)}%` };
    } else if (edge === 2) {
      nextStyle = { left: `${leftPos}px`, top: `${randomPercent(8, 65)}%` };
    } else {
      nextStyle = { right: `${rightPos}px`, top: `${randomPercent(8, 65)}%` };
    }

    nextStyle = {
      ...nextStyle,
      margin: `${edgeMargin}px`,
    };
    setJokeStyle(nextStyle);
  }, [loading, mode, currentIndex, images.length]);

  if (loading) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-message">Loading slideshow...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-message slideshow-error">{error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="slideshow-page">
        <div className="slideshow-message">No slideshow images uploaded yet.</div>
      </div>
    );
  }

  if (mode === 'presence') {
    return (
      <div className="slideshow-page slideshow-presence">
        <PresenceBoard />
        <div className="slideshow-countdown">{remainingSeconds}s</div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="slideshow-page">
      <img
        className="slideshow-image"
        src={currentImage.url}
        alt={currentImage.name}
      />
      {currentJoke && (
        <div className="slideshow-joke" style={jokeStyle} aria-live="polite">
          {currentJoke}
        </div>
      )}
      <div className="slideshow-countdown">{remainingSeconds}s</div>
    </div>
  );
}

export default SlideshowPage;
