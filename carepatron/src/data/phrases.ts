// The words clinicians write with. Notes are assembled from these, so each
// one reads differently but plausibly. All of it is fictional.
//
// `reports` follow the client's name ("Ava reported…"), `focus` follows
// "Session focused on…", and the rest are whole sentences.

import type { Concern } from './roster';

export interface Bank {
  reports: string[];
  focus: string[];
  assessments: string[];
  homework: string[];
}

export const BANKS: Record<Concern, Bank> = {
  anxiety: {
    reports: [
      'reported a demanding week and rated their anxiety at {rating}/10 on most days.',
      'described lying awake with racing thoughts about the week ahead.',
      'noticed fewer "what if" spirals this week and used paced breathing before a presentation.',
      'said they skipped a friend\'s birthday party because they "couldn\'t face" the crowd.',
      'reported tension headaches, a tight chest and irritability during a busy stretch.',
      'completed one step from their exposure list and felt proud afterward.',
      'reported sleeping better after cutting out caffeine after midday.',
      "described a spike in worry after a family member's medical appointment.",
    ],
    focus: [
      'cognitive restructuring of their most frequent worry, weighing the evidence for and against it',
      'reviewing the worry log and introducing a daily "worry window"',
      'diaphragmatic breathing and progressive muscle relaxation, practiced in session',
      'planning the next steps of a graded exposure hierarchy',
      'mapping the cycle of avoidance and short-term relief, using a recent example',
      'a mindfulness exercise for noticing anxious thoughts without acting on them',
    ],
    assessments: [
      'Symptoms remain in the moderate range, but client is using coping skills more consistently.',
      'Client shows growing insight into how avoidance keeps their anxiety going.',
      'Steady progress toward goal 1: less daily worry and better sleep.',
      'Anxiety rose this week in response to clear stressors; no new concerns.',
      'Client is engaged and motivated, and the prognosis is good.',
    ],
    homework: [
      'Keep the worry log daily and bring it to the next session.',
      'Practice five minutes of paced breathing each morning.',
      'Complete the next step on the exposure hierarchy.',
      'Limit worrying to the 15-minute window each evening.',
      'Write down one anxious prediction and what actually happened.',
    ],
  },

  depression: {
    reports: [
      'reported low mood most days this week and rated mood at {rating}/10.',
      'described struggling to get out of bed most mornings and skipping breakfast.',
      'went for two walks this week and noticed a small lift in mood afterward.',
      'reported pulling away from friends and leaving messages unanswered.',
      'said they felt "flat" and had little interest in hobbies they used to enjoy.',
      'reported better sleep and more energy since going back to a regular bedtime.',
      'described harsh self-criticism after a small mistake.',
      'reconnected with a sibling and enjoyed a weekend visit.',
    ],
    focus: [
      'behavioral activation, scheduling three small, valued activities for the week',
      'identifying all-or-nothing thinking linked to a recent setback',
      'reviewing the activity and mood log for links between what they do and how they feel',
      'self-compassion as an alternative to self-criticism',
      'problem-solving barriers to a steady sleep and wake routine',
      'reviewing the safety plan and protective factors',
    ],
    assessments: [
      'Depressive symptoms persist but are slowly easing as activity increases.',
      'Client is engaging with behavioral activation with partial success.',
      'Mood is lower this week after an interpersonal stressor; client remains engaged.',
      'Clear progress toward goal 1: more pleasant and meaningful activity.',
      'Client shows better insight into the link between withdrawal and low mood.',
    ],
    homework: [
      'Complete the activity schedule and rate mood before and after each activity.',
      'Reach out to one friend this week.',
      'Keep the same wake time every day, weekends included.',
      'Write down one self-critical thought each day, and a kinder alternative.',
      'Walk outside for 15 minutes on at least four days.',
    ],
  },

  trauma: {
    reports: [
      'reported two nightmares this week and waking up feeling "on high alert".',
      'described being startled by a loud noise in a store and taking an hour to settle.',
      'noticed they have been avoiding places that remind them of what happened.',
      'used grounding skills during a flashback and felt more in control.',
      'reported slightly better sleep since starting a wind-down routine.',
      'described irritability with family and feeling cut off from people close to them.',
      'finished writing the impact statement and found it hard but useful.',
      'said intrusive memories came less often this week.',
    ],
    focus: [
      'Cognitive Processing Therapy, reviewing stuck points from the impact statement',
      '5-4-3-2-1 grounding and paced breathing for moments of high arousal',
      'psychoeducation on the fight-flight-freeze response and the role of avoidance',
      'Socratic questioning of self-blame related to the traumatic event',
      'a sleep and nightmare plan, including imagery rehearsal',
      'progress on the in-vivo exposure list',
    ],
    assessments: [
      'PTSD symptoms remain significant, but client is tolerating trauma-focused work well.',
      'Less avoidance; client is approaching situations they used to avoid.',
      'Hyperarousal remains the most impairing group of symptoms.',
      'Client is using grounding skills more effectively when triggered.',
      'Gradual progress toward goal 2: fewer nightmares and better sleep.',
    ],
    homework: [
      'Complete the stuck point log for two situations this week.',
      'Practice grounding twice a day, even when calm.',
      'Keep up the wind-down routine and the nightmare log.',
      'Read the impact statement once before the next session.',
      'Approach one item from the exposure list.',
    ],
  },

  adjustment: {
    reports: [
      'reported feeling overwhelmed by changes at work and rated stress at {rating}/10.',
      'described crying more easily this week and feeling "not like myself".',
      'set a boundary with a family member and felt relieved afterward.',
      'reported trouble concentrating and falling behind on household tasks.',
      'noticed that a regular routine is making the days more manageable.',
      'described feeling unsettled after a change in their living situation.',
      'reported leaning on their support network more often.',
      'said they are starting to feel more settled.',
    ],
    focus: [
      'the losses and changes that come with the current transition',
      'problem-solving therapy, breaking one stressor into manageable steps',
      'validating their feelings and normalizing how uneven adjustment can be',
      'strengths and coping strategies that worked in past transitions',
      'a values clarification exercise to guide next steps',
      'self-care and the balance of rest, connection and activity',
    ],
    assessments: [
      'Symptoms are consistent with an adjustment reaction and are gradually easing.',
      'Client is coping more effectively and using their support network.',
      'Stress rose this week with a new stressor; client is using skills.',
      'Good progress toward goal 1: restoring daily routine and functioning.',
      'Client is resilient and engaged, and the prognosis is good.',
    ],
    homework: [
      'Use the problem-solving worksheet for one current stressor.',
      'Schedule one restorative activity each day.',
      'Write a short letter about what has changed and what has stayed the same.',
      'Keep a simple routine for mornings and evenings.',
      'Share one feeling with someone they trust this week.',
    ],
  },

  grief: {
    reports: [
      'spoke about their late husband and described evenings as the hardest time.',
      'reported avoiding the spare room because it "still feels like his".',
      'shared a happy memory with a smile, for the first time in session.',
      'described feeling numb at a family gathering and leaving early.',
      'reached out to an old friend and met for lunch.',
      'said the coming holidays are bringing back a lot of sadness.',
      'reported sleeping poorly and waking in the early hours.',
      'joined a community walking group and went twice.',
    ],
    focus: [
      'revisiting the story of the loss, using prolonged grief therapy techniques',
      'meaningful ways to stay connected to the person who died',
      'situations they have been avoiding, and a plan to gradually re-engage',
      'planning for an upcoming anniversary',
      'self-compassion on days when grief feels overwhelming',
      'the evening routine and a plan for the hardest hours',
    ],
    assessments: [
      'Grief remains intense, but client is engaging more with daily life.',
      'Client is beginning to hold sadness and good memories together.',
      'Avoidance is easing; client re-engaged with one valued activity.',
      'Mood is lower this week ahead of the anniversary, which is expected and manageable.',
      'Steady progress toward goal 1: restoring meaningful activity and connection.',
    ],
    homework: [
      'Spend ten minutes with photos or memories, then do something nourishing.',
      'Plan one social contact this week.',
      'Write down what they would like the anniversary to look like.',
      'Keep the evening routine and notice how it affects sleep.',
      'Visit one place they have been avoiding, with support.',
    ],
  },

  adhd: {
    reports: [
      'missed two assignment deadlines and felt frustrated with themselves.',
      'used the planner most days and finished homework earlier.',
      'said mornings are chaotic and they are often late for their first class.',
      'reported losing focus in long lectures and zoning out.',
      'found that breaking tasks into 20-minute blocks helped with a project.',
      'reported feeling overwhelmed by a pile of unfinished work.',
      'noticed they work better with music on and a clear desk.',
      'felt proud after handing in all their work this week.',
    ],
    focus: [
      'a visual weekly plan with time blocks for study and breaks',
      'breaking a large assignment into concrete next steps',
      'their strengths, and reframing self-criticism about ADHD',
      'a shorter morning routine checklist',
      'role-playing how to ask for accommodations at school',
      'small rewards for finishing work, and how to use them',
    ],
    assessments: [
      'Executive functioning challenges persist; client is using external supports more often.',
      'Better organization at school this week.',
      'Frustration tolerance is improving and client is less self-critical.',
      'Steady progress toward goal 1: completing and submitting work on time.',
      'Client responds well to concrete, visual strategies.',
    ],
    homework: [
      'Use the planner every day and check it before bed.',
      'Try 20 minutes of work and a 5-minute break for study sessions.',
      'Follow the morning checklist on at least four days.',
      'Ask about extra time on tests.',
      'Track completed assignments on the chart.',
    ],
  },

  couples: {
    reports: [
      'and {partner} reported two arguments this week about household responsibilities.',
      'described feeling unheard when {partner} checks their phone during conversations.',
      'and {partner} had "a good week" and a date night they both enjoyed.',
      'and {partner} described conflict escalating over money and holiday plans.',
      'and {partner} used the time-out agreement once, and it worked.',
      'and {partner} reported feeling closer after a weekend away.',
      'said they feel criticized by {partner} and shut down to avoid conflict.',
      'and {partner} described tension about long work hours.',
    ],
    focus: [
      "mapping the couple's negative interaction cycle, using a recent argument",
      'the speaker-listener technique for a difficult conversation',
      'softened start-ups and repair attempts, practiced in session',
      'the attachment needs underneath recurring conflict',
      'the time-out agreement and self-soothing strategies',
      'shared goals for the coming year',
    ],
    assessments: [
      'The couple is engaged and motivated, and conflict is less intense.',
      'The pursue-withdraw pattern is still active, but both partners can name it.',
      'Better use of repair attempts.',
      'Steady progress toward goal 1: fewer escalating arguments.',
      'Both partners are committed to the work.',
    ],
    homework: [
      'Hold a 20-minute weekly check-in using the speaker-listener format.',
      'Each partner notices and names one appreciation a day.',
      'Use the time-out agreement if an argument escalates.',
      'Plan one shared activity that is just for fun.',
    ],
  },

  perinatal: {
    reports: [
      'reported feeling exhausted and tearful most afternoons and rated mood at {rating}/10.',
      "described intrusive worries about the baby's health at night.",
      'said she accepted help from her mother twice this week and was able to nap.',
      'reported feeling guilty for not "enjoying every moment".',
      'went to a new-parents group and found it reassuring.',
      "reported more patience with the baby after a better night's sleep.",
      'described tension with her partner about night feeds.',
      "reported small moments of joy, like the baby's first smiles.",
    ],
    focus: [
      'the guilt and pressure of unrealistic expectations of new parenthood',
      'a plan to share night feeds and protect sleep',
      'interpersonal therapy on the role transition to parenthood',
      'scheduling small pleasant activities with and without the baby',
      'telling intrusive thoughts apart from intentions, and reducing reassurance-seeking',
      'building a support network of family, friends and the new-parents group',
    ],
    assessments: [
      'Perinatal depressive symptoms persist but are easing with more support and sleep.',
      'Client is more self-compassionate about the demands of new parenthood.',
      'Intrusive worries are less distressing and less frequent.',
      'Steady progress toward goal 1: lower mood symptoms and more rest.',
      'Client is engaged, and bonding with the baby is reported as good.',
    ],
    homework: [
      'Ask for help with night feeds at least twice this week.',
      'Take one short walk outside each day, with or without the baby.',
      'Notice one moment each day that felt okay or good.',
      'Return to the new-parents group.',
      'Use the thought record when guilt shows up.',
    ],
  },
};

export const MENTAL_STATUS = {
  inPerson: [
    'Arrived on time, casually dressed and well groomed.',
    'Arrived a few minutes early and appropriately dressed.',
    'Arrived on time and appropriately dressed.',
  ],
  telehealth: ['Joined the video session on time from home.', 'Joined on time from a private room at home.'],
  manner: ['Alert and oriented x4.', 'Alert, oriented and cooperative.', 'Good eye contact and rapport.'],
  /** What the client said their mood was, and the affect the clinician saw, in pairs that fit. */
  moods: [
    ['okay', 'euthymic'],
    ['stressed', 'anxious, congruent with mood'],
    ['tired', 'constricted'],
    ['a bit better', 'brighter than last session'],
    ['anxious', 'anxious'],
    ['pretty good', 'bright and reactive'],
    ['flat', 'flat and constricted'],
    ['up and down', 'tearful at times'],
  ] as [mood: string, affect: string][],
  thought: [
    'Thought process linear and goal-directed.',
    'Speech normal in rate and volume; thought process logical.',
    'No evidence of psychosis.',
  ],
};

export const TELEHEALTH_CONSENT = 'Session held by secure video. Client confirmed they were at home in a private space, in California.';

export const RISK = [
  'Denied suicidal and homicidal ideation, intent or plan.',
  'No safety concerns identified; denied SI/HI.',
  'Denied thoughts of harming themselves or others.',
];

export const RESPONSES = [
  'Client was receptive and picked two situations to practice with this week.',
  'Client engaged with the exercise and reported feeling calmer by the end of session.',
  'Client found the exercise hard at first but was able to stay with it.',
  'Client was reflective and connected the work to recent events.',
  'Client agreed with the plan and was motivated to try the new strategy.',
];

export const COUPLES_RESPONSES = [
  'Both partners were receptive and practiced the skill with coaching.',
  '{partner} was defensive at first but re-engaged after a short pause.',
  'The couple picked a specific situation to try the new approach with this week.',
  'Both partners were able to name their part in the cycle.',
];

export const FAMILY_FOCUS = [
  'agreeing on a plan for anxious school mornings',
  'how Mei can coach coping skills without taking over',
  'reviewing the reward chart and what is working',
  'communication at home when Lily is overwhelmed',
];

export const GROUP_TOPICS = [
  'Understanding anxiety and the fight-or-flight response',
  'The CBT model: thoughts, feelings and behaviors',
  'Catching anxious thoughts',
  'Challenging anxious predictions',
  'Breathing and relaxation skills',
  'Facing fears: building an exposure ladder',
  'Mindfulness and letting thoughts pass',
  'Worry time and problem-solving',
  'Sleep and anxiety',
  'Self-compassion',
  'Relapse prevention',
  'Review and celebration',
];

export const GROUP_PARTICIPATION = [
  'participated actively and shared an example from work.',
  'was quieter today but joined in with the breathing exercise.',
  'offered support to another member and practiced the skill in pairs.',
  'arrived ten minutes late and took part in the second half.',
  'shared progress on their exposure ladder.',
  'asked thoughtful questions and volunteered for the role-play.',
];

/** What brought each client in, by their primary diagnosis. Clients who share a diagnosis get different stories. */
export const PRESENTING: Record<string, string | string[]> = {
  'F41.1': [
    'Describes worrying most of the day about work, health and family for over a year, with restlessness, muscle tension and trouble falling asleep. The worry is starting to affect concentration, and they have begun turning down social plans.',
    'Reports constant worry since a promotion last year: rereading emails many times, lying awake planning the next day, and tension headaches most afternoons. Has stopped going to the gym to keep up with work.',
    'Describes being a "lifelong worrier" whose anxiety has grown since their father became unwell. Feels on edge most days, checks in with family several times a day, and struggles to relax even on weekends.',
  ],
  'F41.0':
    'Reports sudden episodes of racing heart, shortness of breath and fear of dying, the first on a crowded train four months ago. Now avoids public transport and worries about the next attack most days.',
  'F40.10':
    'Describes intense fear of being judged in social situations since high school. Avoids speaking in meetings or class, leaves gatherings early, and rehearses conversations for hours beforehand.',
  'F43.10':
    'Was in a serious car accident two years ago. Reports nightmares, flashbacks, startling easily and avoiding driving on the freeway. Feels on edge most of the time and is short-tempered with family.',
  // Carlos and Olivia's stories are on the roster.
  'F33.0':
    'Reports a return of low mood, low energy and poor sleep over the past two months. Has had similar episodes before. Still working, but finds it hard to enjoy anything.',
  'F33.1': [
    'Reports low mood, loss of interest, fatigue and poor concentration for several months, the third such episode in their life. Has been calling in sick at work and withdrawing from friends.',
    'Describes a return of the depression they last had five years ago: waking at 4am, little appetite, and losing interest in things they usually enjoy. Family noticed they have become withdrawn.',
    'Reports feeling "heavy" and hopeless for most of the past three months, with low energy and trouble concentrating. Has had two similar episodes before, both after big changes at work.',
  ],
  'F32.1': [
    'Reports low mood, tearfulness, poor sleep and loss of motivation since a breakup in the spring. Struggling to keep up at work and has stopped exercising.',
    'Describes feeling flat and exhausted since moving across the country for a new job in the summer. Has made no friends yet, sleeps late on weekends and has lost interest in cooking and music.',
    'Reports two months of low mood after being passed over for a promotion, with poor sleep, irritability and pulling away from their partner. This is the first time they have felt like this.',
  ],
  'F43.23': [
    'Reports stress, low mood and worry since a major life change in the past few months. Sleep is disrupted and they feel overwhelmed by daily tasks.',
    'Was laid off three months ago after twelve years with the same company. Reports worry about money, low mood, and feeling lost without a routine.',
    'Separated from their partner over the summer and moved into an apartment alone. Reports tearfulness, poor sleep and trouble concentrating at work.',
    'Reports feeling overwhelmed since becoming the main caregiver for a parent with dementia this year. Worried and low, and has little time for themselves.',
  ],
  'F43.81':
    'Lost her husband of 41 years fourteen months ago. Reports intense longing, difficulty accepting the death, avoiding reminders, and feeling that life has lost its meaning.',
  'F90.0':
    'Graduate student reporting lifelong difficulty with focus, organization and deadlines, now worse with a heavier workload. Loses track of time and often starts assignments the night before they are due.',
  'F90.2':
    'High school student referred by the school counselor for difficulty staying on task, impulsivity in class and incomplete homework. Parents report daily conflict about schoolwork.',
  'F53.0':
    'Gave birth to her first child four months ago. Reports low mood, tearfulness, guilt and intrusive worries about the baby. Sleep is very limited and she feels she is "failing" as a mother.',
  'Z63.0':
    'The couple report a year of frequent arguments about household responsibilities, money and time together. Both want to stay together and improve how they communicate.',
};

/** Background for intake assessments, for adults and for teenagers. */
export const HISTORY = {
  adult: {
    psychiatric: [
      'No previous mental health treatment.',
      'Saw a school counselor briefly as a teenager. No hospitalizations.',
      'Previous episode of depression treated by their primary care physician with sertraline.',
      'Six months of therapy in their twenties, which they found helpful. No hospitalizations.',
    ],
    substances: [
      'Drinks alcohol socially, one or two drinks a week. Denies drug use.',
      'Does not drink or use drugs.',
      'Drinks two or three glasses of wine a week. Denies drug use.',
    ],
    protective: [
      'supportive family, steady work and plans for the future',
      'close friendships and a strong sense of responsibility to family',
      'engagement in treatment and a regular exercise routine',
    ],
  },
  teen: {
    psychiatric: ['No previous mental health treatment.', 'Saw the school counselor a few times last year.'],
    substances: ['Denies alcohol, vaping and drug use.'],
    protective: ['a close, supportive family and good friendships', 'engagement at school and in sports'],
  },
  medical: [
    'No significant medical history. No current medications.',
    'Hypothyroidism, managed with levothyroxine.',
    'Seasonal allergies. No current psychiatric medications.',
    'Asthma, well controlled with an inhaler.',
  ],
};

/** Treatment plan goals and interventions, by concern. */
export const PLANS: Record<Concern, { goals: [string, string[]][]; interventions: string }> = {
  anxiety: {
    goals: [
      [
        'Reduce worry and its impact on sleep and work',
        ['GAD-7 below 10 for four weeks in a row', 'Use a coping skill when anxious on most days'],
      ],
      ['Re-engage with situations being avoided', ['Complete five steps of the exposure hierarchy']],
    ],
    interventions: 'Cognitive behavioral therapy, cognitive restructuring, graded exposure, relaxation training.',
  },
  depression: {
    goals: [
      ['Improve mood and daily functioning', ['PHQ-9 below 10', 'At least three valued activities each week']],
      ['Reduce self-criticism', ['Notice and reframe self-critical thoughts in daily life']],
    ],
    interventions: 'Behavioral activation, cognitive behavioral therapy, self-compassion work, sleep routine.',
  },
  trauma: {
    goals: [
      ['Reduce intrusive memories and nightmares', ['PCL-5 below 33', 'Fewer than one nightmare a week']],
      ['Reduce avoidance', ['Approach four situations currently avoided']],
    ],
    interventions: 'Cognitive Processing Therapy, grounding skills, in-vivo exposure.',
  },
  adjustment: {
    goals: [
      ['Restore daily routine and functioning', ['Keep a consistent routine five days a week']],
      ['Strengthen coping and support', ['Use their support network at least weekly']],
    ],
    interventions: 'Supportive therapy, problem-solving therapy, values work.',
  },
  grief: {
    goals: [
      ['Re-engage with meaningful activity and relationships', ['One social activity each week']],
      ['Process the loss', ['Talk about the loss and look at reminders without overwhelming distress']],
    ],
    interventions: 'Prolonged grief therapy techniques, behavioral activation, memory work.',
  },
  adhd: {
    goals: [
      ['Complete and submit work on time', ['Use the planner daily', 'Submit 90% of assignments on time']],
      ['Reduce conflict and self-criticism about schoolwork', ['Fewer than one argument about homework a week']],
    ],
    interventions: 'Executive function coaching, CBT for ADHD, collaboration with family and school.',
  },
  couples: {
    goals: [
      ['Reduce escalating conflict', ['Use the time-out agreement', 'Fewer than one escalated argument a week']],
      ['Increase connection', ['A weekly check-in and one shared activity']],
    ],
    interventions: 'Gottman Method couples therapy, Emotionally Focused Therapy.',
  },
  perinatal: {
    goals: [
      ['Reduce depressive symptoms', ['EPDS below 10']],
      ['Increase support and rest', ['Ask for help with night feeds twice a week']],
    ],
    interventions: 'Interpersonal therapy, behavioral activation, coordination with OB/GYN.',
  },
};
