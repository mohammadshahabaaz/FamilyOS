import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

const p = (seed: string, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`
const thumb = (seed: string) => p(seed, 400, 250)
const avatar = (n: number) => `https://i.pravatar.cc/150?img=${n}`
const MB = (n: number) => BigInt(Math.round(n * 1024 * 1024))

async function main() {
  console.log('Seeding FamilyOS — 100+ records...\n')

  await prisma.notification.deleteMany()
  await prisma.storyView.deleteMany()
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.media.deleteMany()
  await prisma.eventPerson.deleteMany()
  await prisma.event.deleteMany()
  await prisma.story.deleteMany()
  await prisma.profileRequest.deleteMany()
  await prisma.treeLink.deleteMany()
  await prisma.relationshipEdge.deleteMany()
  await prisma.familyMember.deleteMany()
  await prisma.person.deleteMany()
  await prisma.familyTree.deleteMany()
  await prisma.user.deleteMany()

  const pwTest = await argon2.hash('123456')
  const pw     = await argon2.hash('demo1234')

  // ─────────────────────────────────────────────────────────────────────────
  // USERS (15)
  // ─────────────────────────────────────────────────────────────────────────
  const testUser = await prisma.user.create({ data: {
    mobileNumber: '9581469690', passwordHash: pwTest, uniqueUserId: 'FOS-TEST01', username: 'testuser',
  }})

  // Khan family users
  const tariqU  = await prisma.user.create({ data: { mobileNumber: '+923001234567', passwordHash: pw, uniqueUserId: 'FOS-TARIQ1', username: 'tariq_khan',   profilePicUrl: avatar(11) }})
  const nadiaU  = await prisma.user.create({ data: { mobileNumber: '+923009876543', passwordHash: pw, uniqueUserId: 'FOS-NADIA1', username: 'nadia_khan',   profilePicUrl: avatar(49) }})
  const imranU  = await prisma.user.create({ data: { mobileNumber: '+923005554433', passwordHash: pw, uniqueUserId: 'FOS-IMRAN1', username: 'imran_khan',   profilePicUrl: avatar(52) }})
  const sanaU   = await prisma.user.create({ data: { mobileNumber: '+923007778899', passwordHash: pw, uniqueUserId: 'FOS-SANA01', username: 'sana_imran',   profilePicUrl: avatar(44) }})
  const zaidU   = await prisma.user.create({ data: { mobileNumber: '+923011112233', passwordHash: pw, uniqueUserId: 'FOS-ZAID01', username: 'zaid_khan',    profilePicUrl: avatar(16) }})
  const saraU   = await prisma.user.create({ data: { mobileNumber: '+923022223344', passwordHash: pw, uniqueUserId: 'FOS-SARA01', username: 'sara_khan',    profilePicUrl: avatar(26) }})
  const omarU   = await prisma.user.create({ data: { mobileNumber: '+923033334455', passwordHash: pw, uniqueUserId: 'FOS-OMAR01', username: 'omar_khan',    profilePicUrl: avatar(55) }})
  const ahmedU  = await prisma.user.create({ data: { mobileNumber: '+923044445566', passwordHash: pw, uniqueUserId: 'FOS-AHMD1', username: 'ahmed_khan',   profilePicUrl: avatar(69) }})

  // Sharma family users
  const aryanU  = await prisma.user.create({ data: { mobileNumber: '+919001112233', passwordHash: pw, uniqueUserId: 'FOS-ARYAN1', username: 'aryan_sharma', profilePicUrl: avatar(65) }})
  const priyaU  = await prisma.user.create({ data: { mobileNumber: '+919002223344', passwordHash: pw, uniqueUserId: 'FOS-PRIYA1', username: 'priya_sharma', profilePicUrl: avatar(47) }})
  const raviU   = await prisma.user.create({ data: { mobileNumber: '+919003334455', passwordHash: pw, uniqueUserId: 'FOS-RAVI01', username: 'ravi_sharma',  profilePicUrl: avatar(70) }})
  const kavyaU  = await prisma.user.create({ data: { mobileNumber: '+919004445566', passwordHash: pw, uniqueUserId: 'FOS-KAVYA1', username: 'kavya_sharma', profilePicUrl: avatar(41) }})
  const neelamU = await prisma.user.create({ data: { mobileNumber: '+919005556677', passwordHash: pw, uniqueUserId: 'FOS-NEEL1', username: 'neelam_sharma', profilePicUrl: avatar(33) }})
  const devU    = await prisma.user.create({ data: { mobileNumber: '+919006667788', passwordHash: pw, uniqueUserId: 'FOS-DEV01', username: 'dev_sharma',    profilePicUrl: avatar(17) }})

  // ─────────────────────────────────────────────────────────────────────────
  // KHAN FAMILY TREE — 4 generations, 20 persons
  // ─────────────────────────────────────────────────────────────────────────
  const khanTree = await prisma.familyTree.create({ data: { name: 'Khan Family', timezone: 'Asia/Karachi' }})
  const KT = khanTree.id

  // Gen 0 — great-grandparents (deceased)
  const bilal = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Bilal', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('1910-04-01'), isDeceased: true, profilePicUrl: avatar(2) }})
  const zubeda = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Zubeda', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('1916-09-12'), isDeceased: true, profilePicUrl: avatar(8) }})

  // Gen 1
  const hasan = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Hasan', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('1940-03-15'), isDeceased: true, profilePicUrl: avatar(3) }})
  const fatima = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Fatima', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('1945-08-22'), profilePicUrl: avatar(20) }})

  // Gen 2
  const tariqP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: tariqU.id,
    firstName: 'Tariq', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('1975-06-10'), profilePicUrl: tariqU.profilePicUrl }})
  const nadiaP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: nadiaU.id,
    firstName: 'Nadia', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('1978-11-30'), profilePicUrl: nadiaU.profilePicUrl }})
  const imranP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: imranU.id,
    firstName: 'Imran', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('1977-02-14'), profilePicUrl: imranU.profilePicUrl }})
  const sanaP  = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: sanaU.id,
    firstName: 'Sana', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('1980-05-05'), profilePicUrl: sanaU.profilePicUrl }})
  const omarP  = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: omarU.id,
    firstName: 'Omar', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('1979-09-18'), profilePicUrl: omarU.profilePicUrl }})
  const rukhP  = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Rukhsana', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('1982-04-22'), profilePicUrl: avatar(32) }})
  const samP   = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Samreen', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('1983-07-10'), profilePicUrl: avatar(35) }})

  // Gen 3
  const zaidP  = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: zaidU.id,
    firstName: 'Zaid', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('2005-04-20'), profilePicUrl: zaidU.profilePicUrl }})
  const saraP  = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: saraU.id,
    firstName: 'Sara', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('2008-09-05'), profilePicUrl: saraU.profilePicUrl }})
  const ahmedP = await prisma.person.create({ data: { familyTreeId: KT, createdById: imranU.id, linkedUserId: ahmedU.id,
    firstName: 'Ahmed', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('2007-12-12'), profilePicUrl: ahmedU.profilePicUrl }})
  const aishaP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Aisha', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('2010-03-07'), profilePicUrl: avatar(39) }})
  const aliP   = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id, linkedUserId: testUser.id,
    firstName: 'Ali', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('2009-07-14'), profilePicUrl: avatar(60) }})
  const yasirP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Yasir', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('2012-01-30'), profilePicUrl: avatar(58) }})
  const hamnaP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Hamna', lastName: 'Khan', gender: 'FEMALE', dateOfBirth: new Date('2015-06-11'), profilePicUrl: avatar(30) }})
  const umarjP = await prisma.person.create({ data: { familyTreeId: KT, createdById: tariqU.id,
    firstName: 'Umarj', lastName: 'Khan', gender: 'MALE', dateOfBirth: new Date('2018-02-14'), profilePicUrl: avatar(62) }})

  await prisma.familyTree.update({ where: { id: KT }, data: { rootPersonId: hasan.id } })

  // Edges
  const ke: Array<{ from: string; to: string; type: 'PARENT' | 'SPOUSE' | 'SIBLING' }> = [
    // Gen 0 → Gen 1
    { from: bilal.id, to: hasan.id, type: 'PARENT' },
    { from: zubeda.id, to: hasan.id, type: 'PARENT' },
    { from: bilal.id, to: zubeda.id, type: 'SPOUSE' },
    // Gen 1
    { from: hasan.id, to: fatima.id, type: 'SPOUSE' },
    // Gen 1 → Gen 2
    { from: hasan.id, to: tariqP.id, type: 'PARENT' }, { from: fatima.id, to: tariqP.id, type: 'PARENT' },
    { from: hasan.id, to: imranP.id, type: 'PARENT' }, { from: fatima.id, to: imranP.id, type: 'PARENT' },
    { from: hasan.id, to: omarP.id,  type: 'PARENT' }, { from: fatima.id, to: omarP.id,  type: 'PARENT' },
    { from: hasan.id, to: samP.id,   type: 'PARENT' }, { from: fatima.id, to: samP.id,   type: 'PARENT' },
    // Gen 2 spouses
    { from: tariqP.id, to: nadiaP.id, type: 'SPOUSE' },
    { from: imranP.id, to: sanaP.id,  type: 'SPOUSE' },
    { from: omarP.id,  to: rukhP.id,  type: 'SPOUSE' },
    // Gen 2 siblings
    { from: tariqP.id, to: imranP.id, type: 'SIBLING' },
    { from: tariqP.id, to: omarP.id,  type: 'SIBLING' },
    { from: tariqP.id, to: samP.id,   type: 'SIBLING' },
    { from: imranP.id, to: omarP.id,  type: 'SIBLING' },
    { from: imranP.id, to: samP.id,   type: 'SIBLING' },
    { from: omarP.id,  to: samP.id,   type: 'SIBLING' },
    // Gen 2 → Gen 3 (Tariq's kids)
    { from: tariqP.id, to: zaidP.id, type: 'PARENT' }, { from: nadiaP.id, to: zaidP.id, type: 'PARENT' },
    { from: tariqP.id, to: saraP.id, type: 'PARENT' }, { from: nadiaP.id, to: saraP.id, type: 'PARENT' },
    { from: zaidP.id, to: saraP.id, type: 'SIBLING' },
    // Gen 2 → Gen 3 (Imran's kids)
    { from: imranP.id, to: ahmedP.id, type: 'PARENT' }, { from: sanaP.id, to: ahmedP.id, type: 'PARENT' },
    { from: imranP.id, to: yasirP.id, type: 'PARENT' }, { from: sanaP.id, to: yasirP.id, type: 'PARENT' },
    { from: imranP.id, to: hamnaP.id, type: 'PARENT' }, { from: sanaP.id, to: hamnaP.id, type: 'PARENT' },
    { from: ahmedP.id, to: yasirP.id, type: 'SIBLING' },
    { from: ahmedP.id, to: hamnaP.id, type: 'SIBLING' },
    { from: yasirP.id, to: hamnaP.id, type: 'SIBLING' },
    // Gen 2 → Gen 3 (Omar's kids)
    { from: omarP.id, to: aishaP.id, type: 'PARENT' }, { from: rukhP.id, to: aishaP.id, type: 'PARENT' },
    { from: omarP.id, to: aliP.id,   type: 'PARENT' }, { from: rukhP.id, to: aliP.id,   type: 'PARENT' },
    { from: omarP.id, to: umarjP.id, type: 'PARENT' }, { from: rukhP.id, to: umarjP.id, type: 'PARENT' },
    { from: aishaP.id, to: aliP.id,   type: 'SIBLING' },
    { from: aishaP.id, to: umarjP.id, type: 'SIBLING' },
    { from: aliP.id,   to: umarjP.id, type: 'SIBLING' },
  ]
  for (const e of ke) {
    await prisma.relationshipEdge.create({ data: { treeId: KT, fromPersonId: e.from, toPersonId: e.to, relationType: e.type }})
  }

  await prisma.familyMember.createMany({ data: [
    { userId: tariqU.id,  treeId: KT, role: 'SUPER_ADMIN' },
    { userId: imranU.id,  treeId: KT, role: 'ADMIN' },
    { userId: omarU.id,   treeId: KT, role: 'ADMIN' },
    { userId: nadiaU.id,  treeId: KT, role: 'MEMBER' },
    { userId: sanaU.id,   treeId: KT, role: 'MEMBER' },
    { userId: zaidU.id,   treeId: KT, role: 'MEMBER' },
    { userId: saraU.id,   treeId: KT, role: 'MEMBER' },
    { userId: ahmedU.id,  treeId: KT, role: 'MEMBER' },
    { userId: testUser.id, treeId: KT, role: 'MEMBER' },
  ]})

  // ─── KHAN EVENTS (30) ─────────────────────────────────────────────────────
  const ev = async (data: { type: string; title: string; desc: string; date: string; by: string }) =>
    prisma.event.create({ data: { treeId: KT, createdById: data.by, type: data.type as never,
      title: data.title, description: data.desc, date: new Date(data.date), visibility: 'FAMILY' }})

  const e1  = await ev({ type: 'WEDDING',     by: tariqU.id,  date: '2005-12-15', title: "Tariq & Nadia's Nikkah",
    desc: "A beautiful Nikkah at Masjid-e-Tooba followed by Walima at Grand Marquee. Three days of celebration — family flew in from London and Dubai. Dada Hasan couldn't stop smiling." })
  const e2  = await ev({ type: 'WEDDING',     by: imranU.id,  date: '2007-06-20', title: "Imran & Sana's Wedding",
    desc: "Imran Bhai's Nikkah in Lahore followed by a magnificent Barat at Pearl Continental. The mehndi night was legendary — the whole neighbourhood showed up." })
  const e3  = await ev({ type: 'WEDDING',     by: omarU.id,   date: '2010-03-12', title: "Omar & Rukhsana's Nikkah",
    desc: "Omar's surprise wedding — announced only a week before! Held at Dadi's house garden. Small, intimate, and full of laughter. Chachu Tariq did all the decorations himself." })
  const e4  = await ev({ type: 'ANNIVERSARY', by: nadiaU.id,  date: '2023-12-15', title: "Tariq & Nadia — 18 Years Together",
    desc: "18 years of love and growing together. The kids surprised them with breakfast in bed and a handmade photo album. Tariq cried — he'd never admit it." })
  const e5  = await ev({ type: 'ANNIVERSARY', by: sanaU.id,   date: '2024-06-20', title: "Imran & Sana — 17th Anniversary",
    desc: "17 years! Imran took Sana for a surprise dinner in Karachi. The kids planned the evening without telling either parent. Ahmed is already a better event planner than his father." })
  const e6  = await ev({ type: 'BIRTHDAY',    by: nadiaU.id,  date: '2023-09-05', title: "Sara's 15th Birthday",
    desc: "Surprise party planned by Abba. Chocolate fudge cake, cousins showed up unannounced — chaos, laughter, and exactly what Sara wanted." })
  const e7  = await ev({ type: 'BIRTHDAY',    by: tariqU.id,  date: '2020-08-22', title: "Dadi Fatima's 75th Birthday",
    desc: "The whole family gathered to celebrate Dadi turning 75. She wore her favourite green suit. Grandchildren performed a nasheed. The biryani pot from 1985 made a comeback." })
  const e8  = await ev({ type: 'BIRTHDAY',    by: nadiaU.id,  date: '2023-04-20', title: "Zaid Turns 18!",
    desc: "Zaid is officially an adult! His cousins threw a karting day followed by rooftop dinner. He spent the evening hiding from embarrassing baby photos." })
  const e9  = await ev({ type: 'BIRTHDAY',    by: sanaU.id,   date: '2024-12-12', title: "Ahmed's 17th Birthday",
    desc: "Ahmed wanted a quiet birthday — so obviously the family showed up with a 4-tier cake and 30 relatives. He loved it despite pretending to be embarrassed." })
  const e10 = await ev({ type: 'BIRTHDAY',    by: tariqU.id,  date: '2024-03-07', title: "Aisha Turns 14",
    desc: "Aisha's first birthday as a teenager — she requested a stargazing night. Omar Chachu got a telescope. They set up on the rooftop and spotted Saturn's rings. Best birthday ever." })
  const e11 = await ev({ type: 'BIRTHDAY',    by: imranU.id,  date: '2023-01-30', title: "Yasir's 11th Birthday",
    desc: "Yasir wanted a football-themed party and got exactly that — backyard pitch, penalties, and the biggest trophy cake any of us had ever seen. He saved three penalty kicks." })
  const e12 = await ev({ type: 'BIRTHDAY',    by: tariqU.id,  date: '2019-06-10', title: "Abba Tariq Turns 44",
    desc: "The kids planned everything. Homemade biryani, a surprise video message from Uncle Tariq's university friends in Manchester, and a cake shaped like a cricket bat. He was genuinely surprised." })
  const e13 = await ev({ type: 'GATHERING',   by: imranU.id,  date: '2024-04-10', title: "Eid ul-Fitr Reunion 2024",
    desc: "Annual Eid gathering at Dadi's house in Gulshan. Kids had a blast in the garden. Dadi made her legendary sevaiyyan — three pots finished before noon." })
  const e14 = await ev({ type: 'GATHERING',   by: sanaU.id,   date: '2023-11-10', title: "Annual Mehendi Night 2023",
    desc: "The ladies of the Khan family organised a mehendi night. Dadi taught the younger girls patterns she learned from her own mother. Three generations of women, one night to remember." })
  const e15 = await ev({ type: 'GATHERING',   by: tariqU.id,  date: '2023-06-15', title: "Sunday Biryani — June 2023",
    desc: "Unplanned gathering — Nadia mentioned she was making biryani and by noon there were 27 people. Classic Khan family. The pot was supposed to serve 10." })
  const e16 = await ev({ type: 'GATHERING',   by: omarU.id,   date: '2022-04-03', title: "Eid ul-Adha Qurbani 2022",
    desc: "Three families, one courtyard, and the best Eid ul-Adha in years. The children helped carry meat to 40 neighbours. Dadi distributed packages to every house on the street." })
  const e17 = await ev({ type: 'GATHERING',   by: nadiaU.id,  date: '2021-05-13', title: "Dada Hasan's Quran Khatam",
    desc: "One year after Dada's passing — the family gathered to complete a Quran Khatam in his memory. Dadi recited the final dua. Everyone stayed for dinner and shared memories of him." })
  const e18 = await ev({ type: 'TRIP',        by: tariqU.id,  date: '1998-03-20', title: "Dada & Dadi Hajj 1998",
    desc: "Hasan and Fatima performed Hajj together in 1998. A lifelong dream fulfilled. Dada brought back Zamzam water for the entire neighbourhood." })
  const e19 = await ev({ type: 'TRIP',        by: nadiaU.id,  date: '2019-12-26', title: "Dubai Family Vacation 2019",
    desc: "The whole family flew to Dubai for New Year. Zaid and Sara went on their first rollercoaster at Global Village. Ahmed refused to ride it and watched everyone else three times." })
  const e20 = await ev({ type: 'TRIP',        by: tariqU.id,  date: '2022-07-10', title: "Istanbul Trip — Summer 2022",
    desc: "Tariq surprised Nadia with a family trip to Istanbul for their anniversary. Hagia Sophia, Grand Bazaar, a boat on the Bosphorus at sunset. Kids claimed it as their best trip ever." })
  const e21 = await ev({ type: 'TRIP',        by: imranU.id,  date: '2024-03-18', title: "Northern Pakistan Road Trip",
    desc: "Imran, Sana, Ahmed, Yasir, and Hamna drove from Karachi to Hunza in 6 days. Attabad Lake left all of them speechless. Ahmed documented every checkpoint on his phone." })
  const e22 = await ev({ type: 'TRIP',        by: omarU.id,   date: '2023-08-05', title: "Murree Family Weekend",
    desc: "Omar took the family to Murree for a long weekend. Aisha and Ali had a snowball fight in July — the one patch of snow left on the hillside. Umarj slept the entire drive both ways." })
  const e23 = await ev({ type: 'ACHIEVEMENT', by: imranU.id,  date: '2024-08-22', title: "Ahmed's O-Level Results — 9A*s",
    desc: "Ahmed scored 9A* in his O-Levels. The family WhatsApp group exploded. Dadi cried. Chachu Tariq immediately started planning his university options." })
  const e24 = await ev({ type: 'ACHIEVEMENT', by: tariqU.id,  date: '2023-07-15', title: "Zaid Gets His Driving License",
    desc: "Zaid passed his driving test first attempt. Chachu Imran bet he'd fail. Zaid immediately drove to collect the 500 rupees in person. We're all slightly nervous about him on the road." })
  const e25 = await ev({ type: 'ACHIEVEMENT', by: nadiaU.id,  date: '2024-05-20', title: "Sara Wins School Art Prize",
    desc: "Sara's painting 'Three Generations' won first place at the school art exhibition. The painting shows Dadi, Nadia, and Sara — three sets of hands holding chai cups. It made Dadi cry." })
  const e26 = await ev({ type: 'ACHIEVEMENT', by: sanaU.id,   date: '2022-11-30', title: "Ahmed Captains School Cricket Team",
    desc: "Ahmed was named captain of the school cricket team. First Khan to be a sports captain in 25 years — Dadi dug out a photo of Hasan Dada's cricket trophy from 1965." })
  const e27 = await ev({ type: 'ACHIEVEMENT', by: tariqU.id,  date: '2021-03-10', title: "Tariq's Business Expands to Third City",
    desc: "After 12 years of hard work, Tariq opened the third branch of Khan Textiles in Faisalabad. Imran was there for the opening ceremony. Nadia says he never stops working — she's right." })
  const e28 = await ev({ type: 'OTHER',    by: tariqU.id,  date: '2020-05-10', title: "Dada Hasan — In Our Hearts",
    desc: "Hasan Khan passed away peacefully at home, surrounded by his family. He was 80 years old. A man of dignity, humour, and generosity. His Zamzam water is still on the shelf. We miss him every day." })
  const e29 = await ev({ type: 'OTHER',    by: imranU.id,  date: '2021-05-10', title: "First Anniversary of Dada's Passing",
    desc: "We gathered to remember Dada on his first anniversary. Dadi wore the green suit he loved most. We shared stories, made dua, and remembered the way he laughed." })
  const e30 = await ev({ type: 'ACHIEVEMENT', by: ahmedU.id,  date: '2025-03-01', title: "Ahmed Gets A-Level Early Offer — LUMS",
    desc: "Ahmed received an early conditional offer from LUMS for Computer Science before his A-Level exams. Dadi calls it 'the best news since the grandchildren were born.'" })

  // Tag people in Khan events
  const tag = async (eid: string, ...pids: string[]) => {
    await prisma.eventPerson.createMany({ data: pids.map(pid => ({ eventId: eid, personId: pid })) })
  }
  await tag(e1.id,  tariqP.id, nadiaP.id, hasan.id, fatima.id, imranP.id, omarP.id)
  await tag(e2.id,  imranP.id, sanaP.id, hasan.id, fatima.id, tariqP.id, nadiaP.id)
  await tag(e3.id,  omarP.id, rukhP.id, fatima.id, tariqP.id, imranP.id)
  await tag(e4.id,  tariqP.id, nadiaP.id, zaidP.id, saraP.id)
  await tag(e5.id,  imranP.id, sanaP.id, ahmedP.id)
  await tag(e6.id,  saraP.id, tariqP.id, nadiaP.id, zaidP.id, aishaP.id)
  await tag(e7.id,  fatima.id, hasan.id, tariqP.id, imranP.id, omarP.id, samP.id)
  await tag(e8.id,  zaidP.id, tariqP.id, ahmedP.id, aishaP.id, aliP.id)
  await tag(e9.id,  ahmedP.id, imranP.id, sanaP.id, yasirP.id, hamnaP.id)
  await tag(e10.id, aishaP.id, omarP.id, rukhP.id)
  await tag(e11.id, yasirP.id, imranP.id, sanaP.id, ahmedP.id)
  await tag(e12.id, tariqP.id, nadiaP.id, zaidP.id, saraP.id)
  await tag(e13.id, fatima.id, tariqP.id, nadiaP.id, imranP.id, sanaP.id, omarP.id, rukhP.id, zaidP.id, saraP.id, ahmedP.id, aishaP.id, aliP.id, yasirP.id, hamnaP.id, umarjP.id)
  await tag(e14.id, fatima.id, nadiaP.id, sanaP.id, rukhP.id, saraP.id, aishaP.id, hamnaP.id)
  await tag(e15.id, nadiaP.id, tariqP.id, imranP.id, sanaP.id, zaidP.id, ahmedP.id)
  await tag(e16.id, omarP.id, rukhP.id, fatima.id, tariqP.id, imranP.id, aliP.id, aishaP.id, umarjP.id)
  await tag(e17.id, fatima.id, tariqP.id, nadiaP.id, imranP.id, sanaP.id, omarP.id, rukhP.id)
  await tag(e18.id, hasan.id, fatima.id)
  await tag(e19.id, tariqP.id, nadiaP.id, imranP.id, sanaP.id, zaidP.id, saraP.id, ahmedP.id)
  await tag(e20.id, tariqP.id, nadiaP.id, zaidP.id, saraP.id)
  await tag(e21.id, imranP.id, sanaP.id, ahmedP.id, yasirP.id, hamnaP.id)
  await tag(e22.id, omarP.id, rukhP.id, aishaP.id, aliP.id, umarjP.id)
  await tag(e23.id, ahmedP.id, imranP.id, sanaP.id)
  await tag(e24.id, zaidP.id, tariqP.id)
  await tag(e25.id, saraP.id, nadiaP.id)
  await tag(e26.id, ahmedP.id, imranP.id)
  await tag(e27.id, tariqP.id, imranP.id)
  await tag(e28.id, hasan.id, fatima.id, tariqP.id, imranP.id, omarP.id)
  await tag(e29.id, fatima.id, tariqP.id, imranP.id, omarP.id, nadiaP.id, sanaP.id, rukhP.id)
  await tag(e30.id, ahmedP.id, imranP.id, sanaP.id, fatima.id)

  // Media for Khan events (2-3 per event = 70+ items)
  const media = async (eid: string, uid: string, items: Array<{ seed: string; cap: string }>) => {
    await prisma.media.createMany({ data: items.map(m => ({
      eventId: eid, uploadedById: uid, type: 'PHOTO', status: 'READY',
      r2Key: p(m.seed), thumbnailR2Key: thumb(m.seed),
      sizeBytes: MB(1.5 + Math.random() * 2),
      caption: m.cap,
    }))})
  }

  await media(e1.id,  tariqU.id,  [{ seed: 'nikkah05a',   cap: 'Nikkah ceremony — Masjid-e-Tooba'   }, { seed: 'walima05b',   cap: 'Walima banquet — Grand Marquee'    }, { seed: 'nikkah05c',   cap: 'Family photo after the ceremony'   }])
  await media(e2.id,  imranU.id,  [{ seed: 'imranwed07a',  cap: 'Nikkah signing — witnesses gathered' }, { seed: 'imranwed07b',  cap: 'Mehndi night — the ladies'          }, { seed: 'imranwed07c',  cap: 'Barat arriving at Pearl Continental' }])
  await media(e3.id,  omarU.id,   [{ seed: 'omarnikah10a', cap: 'Omar & Rukhsana — just married'      }, { seed: 'omarnikah10b', cap: 'Garden setup — Dadi\'s house'        }])
  await media(e4.id,  nadiaU.id,  [{ seed: 'anni18a',      cap: '18 years — same smile, same love'    }, { seed: 'anni18b',      cap: 'Kids\' surprise breakfast in bed'    }])
  await media(e5.id,  sanaU.id,   [{ seed: 'anni17a',      cap: 'Surprise dinner in Karachi'          }, { seed: 'anni17b',      cap: 'The flowers Ahmed secretly ordered' }])
  await media(e6.id,  nadiaU.id,  [{ seed: 'sarabday23a',  cap: 'Sara blowing out 15 candles'         }, { seed: 'sarabday23b',  cap: 'Cousins piled onto the sofa'         }, { seed: 'sarabday23c',  cap: 'The chocolate fudge cake masterpiece' }])
  await media(e7.id,  tariqU.id,  [{ seed: 'dadi75a',      cap: 'Dadi with all her grandchildren'     }, { seed: 'dadi75b',      cap: 'Nasheed performance by the kids'    }, { seed: 'dadi75c',      cap: 'The legendary biryani pot from 1985' }])
  await media(e8.id,  zaidU.id,   [{ seed: 'zaid18a',      cap: 'Karting day — Zaid winning (again)'  }, { seed: 'zaid18b',      cap: 'Rooftop dinner — the whole crew'    }, { seed: 'zaid18c',      cap: 'The embarrassing baby photos' }])
  await media(e9.id,  ahmedU.id,  [{ seed: 'ahmed17a',     cap: '4-tier cake — more tiers than sense' }, { seed: 'ahmed17b',     cap: '30 relatives who were "just passing"' }])
  await media(e10.id, omarU.id,   [{ seed: 'aisha14a',     cap: 'Rooftop stargazing setup'            }, { seed: 'aisha14b',     cap: 'Telescope pointing at Saturn'       }])
  await media(e11.id, imranU.id,  [{ seed: 'yasir11a',     cap: 'Trophy cake — Yasir saves the penalty'}, { seed: 'yasir11b',    cap: 'Backyard pitch — chachu vs nephew'  }])
  await media(e12.id, zaidU.id,   [{ seed: 'tariq44a',     cap: 'Cricket bat cake — perfectly iced'   }, { seed: 'tariq44b',     cap: 'Surprise video from Manchester'     }])
  await media(e13.id, imranU.id,  [{ seed: 'eid24a',       cap: 'Full family after Eid prayers'        }, { seed: 'eid24b',       cap: 'Dadi\'s legendary sevaiyyan — 3 pots'}, { seed: 'eid24c',    cap: 'Kids in the garden — annual chaos'   }])
  await media(e14.id, sanaU.id,   [{ seed: 'mehendi23a',   cap: 'Dadi teaching the girls her patterns' }, { seed: 'mehendi23b',   cap: 'Three generations of hands'         }])
  await media(e15.id, nadiaU.id,  [{ seed: 'biryani23a',   cap: 'The pot that fed 27 unexpected guests'}, { seed: 'biryani23b',   cap: 'Every cousin somehow showed up'     }])
  await media(e16.id, omarU.id,   [{ seed: 'qurbani22a',   cap: 'Dadi distributing to neighbours'      }, { seed: 'qurbani22b',   cap: 'Three families, one courtyard'      }])
  await media(e17.id, tariqU.id,  [{ seed: 'khatam21a',    cap: 'Dadi reciting the final dua'          }, { seed: 'khatam21b',    cap: 'The family gathering in Dada\'s memory'}])
  await media(e18.id, tariqU.id,  [{ seed: 'hajj98a',      cap: 'Dada and Dadi at Masjid al-Haram'    }, { seed: 'hajj98b',      cap: 'Zamzam water — brought for the whole street'}])
  await media(e19.id, nadiaU.id,  [{ seed: 'dubai19a',     cap: 'Burj Khalifa — New Year eve'          }, { seed: 'dubai19b',     cap: 'Global Village — kids went wild'    }, { seed: 'dubai19c',     cap: 'Ahmed watching the rollercoaster from below'}])
  await media(e20.id, tariqU.id,  [{ seed: 'istanbul22a',  cap: 'Hagia Sophia at golden hour'          }, { seed: 'istanbul22b',  cap: 'Bosphorus boat at sunset'           }, { seed: 'istanbul22c',  cap: 'Grand Bazaar — everyone bought too much'}])
  await media(e21.id, imranU.id,  [{ seed: 'hunza24a',     cap: 'Attabad Lake — turquoise water'       }, { seed: 'hunza24b',     cap: 'Ahmed filming every checkpoint'     }, { seed: 'hunza24c',     cap: 'Family photo at Karimabad viewpoint'  }])
  await media(e22.id, omarU.id,   [{ seed: 'murree23a',    cap: 'The one patch of July snow'           }, { seed: 'murree23b',    cap: 'Aisha and Ali — snowball champions'  }])
  await media(e23.id, imranU.id,  [{ seed: 'olevels24a',   cap: 'Ahmed holding his results — 9A*s'     }, { seed: 'olevels24b',   cap: 'Dadi crying with joy'               }])
  await media(e24.id, zaidU.id,   [{ seed: 'license23a',   cap: 'Zaid with his brand new license'     }, { seed: 'license23b',   cap: 'First solo drive — everyone nervous' }])
  await media(e25.id, nadiaU.id,  [{ seed: 'artprize24a',  cap: 'Sara\'s winning painting — Three Generations'}, { seed: 'artprize24b', cap: 'Prize ceremony at school hall' }])
  await media(e26.id, sanaU.id,   [{ seed: 'cricket22a',   cap: 'Ahmed with the captain\'s armband'    }, { seed: 'cricket22b',   cap: 'Dadi\'s photo of Dada\'s trophy 1965'}])
  await media(e27.id, tariqU.id,  [{ seed: 'business21a',  cap: 'Opening ceremony — third branch'     }, { seed: 'business21b',  cap: 'Khan Textiles — Faisalabad flagship'  }])
  await media(e28.id, tariqU.id,  [{ seed: 'hasan20a',     cap: 'Dada Hasan — his favourite photo'    }, { seed: 'hasan20b',     cap: 'The Zamzam water still on the shelf'  }])
  await media(e29.id, imranU.id,  [{ seed: 'anni1yr21a',   cap: 'Dadi in Dada\'s favourite green suit' }, { seed: 'anni1yr21b',   cap: 'Reading Quran together — in his memory'}])
  await media(e30.id, ahmedU.id,  [{ seed: 'lums25a',      cap: 'Ahmed with the offer letter'          }, { seed: 'lums25b',      cap: 'Dadi called it the best news since the grandkids' }])

  // Khan comments
  await prisma.comment.createMany({ data: [
    { eventId: e1.id,  userId: imranU.id,  text: 'MashAllah what a day that was! 19 years and still going strong Bhai.' },
    { eventId: e1.id,  userId: sanaU.id,   text: 'Tariq bhai could not stop smiling the whole evening!' },
    { eventId: e1.id,  userId: nadiaU.id,  text: 'The best day of my life, alhamdulillah.' },
    { eventId: e1.id,  userId: omarU.id,   text: 'I remember giving the wrong speech at Walima. Still embarrassed.' },
    { eventId: e2.id,  userId: tariqU.id,  text: 'Imran bhai you were shaking so much during the nikah!' },
    { eventId: e2.id,  userId: nadiaU.id,  text: 'Sana bhabhi looked absolutely stunning. That lehnga was perfect.' },
    { eventId: e2.id,  userId: sanaU.id,   text: 'Best day. 17 years on and I\'d choose it again.' },
    { eventId: e3.id,  userId: tariqU.id,  text: 'Omar you announced it a WEEK before! We are still in shock.' },
    { eventId: e3.id,  userId: imranU.id,  text: 'The garden setup Tariq did in 3 days was actually beautiful.' },
    { eventId: e4.id,  userId: imranU.id,  text: '18 years! May Allah bless you both with many more decades.' },
    { eventId: e4.id,  userId: zaidU.id,   text: 'Best parents ever. The photo album took me 3 weeks btw.' },
    { eventId: e4.id,  userId: saraU.id,   text: 'Abba pretended he wasn\'t crying. He definitely was.' },
    { eventId: e6.id,  userId: tariqU.id,  text: 'Proud Abba moment. My little girl, 15 already.' },
    { eventId: e6.id,  userId: zaidU.id,   text: 'Happy birthday my annoying little sis! Love you though.' },
    { eventId: e6.id,  userId: ahmedU.id,  text: 'Best cousin! Happy 15 Sara phuppo!' },
    { eventId: e7.id,  userId: tariqU.id,  text: 'Ammi looked so radiant. 75 and still going strong, MashAllah.' },
    { eventId: e7.id,  userId: imranU.id,  text: 'That nasheed had Dadi in tears. SubhanAllah.' },
    { eventId: e8.id,  userId: saraU.id,   text: 'Happy 18th! Now stop asking me to do things for you!' },
    { eventId: e8.id,  userId: tariqU.id,  text: 'My son is 18. I am not sure how to feel. Time goes too fast.' },
    { eventId: e8.id,  userId: ahmedU.id,  text: 'Chachu Zaid drove us home! We made it alive!' },
    { eventId: e9.id,  userId: imranU.id,  text: 'Ahmed I told you I\'d get the 4-tier. Worth every rupee.' },
    { eventId: e9.id,  userId: sanaU.id,   text: '30 relatives just "happened" to be in the area. As always.' },
    { eventId: e13.id, userId: tariqU.id,  text: 'Ammi looked so happy surrounded by everyone. Miss Dada on days like this.' },
    { eventId: e13.id, userId: nadiaU.id,  text: 'The sevaiyyan was gone before 11am — 3 pots. Family record.' },
    { eventId: e13.id, userId: sanaU.id,   text: 'Kids are growing up so fast, subhanAllah.' },
    { eventId: e13.id, userId: testUser.id,text: 'The best Eid gathering. Dadi makes everything feel like home.' },
    { eventId: e14.id, userId: nadiaU.id,  text: 'Dadi remembered every pattern from her mother. What a woman.' },
    { eventId: e14.id, userId: saraU.id,   text: 'I still have the mehndi on my hands a week later!' },
    { eventId: e18.id, userId: nadiaU.id,  text: 'Dada always got emotional when he spoke about this trip. May Allah grant him Jannatul Firdaus.' },
    { eventId: e18.id, userId: imranU.id,  text: 'He brought Zamzam water for the whole street. That was Dada to his core.' },
    { eventId: e19.id, userId: imranU.id,  text: 'Ahmed watching the rollercoaster from the ground will never not be funny.' },
    { eventId: e19.id, userId: saraU.id,   text: 'That was the best holiday ever. Can we please go again?' },
    { eventId: e20.id, userId: nadiaU.id,  text: 'Istanbul in June is magical. That Bosphorus sunset — I still think about it.' },
    { eventId: e20.id, userId: zaidU.id,   text: 'I bought 4 kilos of Turkish delight. Zero regrets.' },
    { eventId: e21.id, userId: sanaU.id,   text: 'Attabad Lake is one of the most beautiful things I have ever seen.' },
    { eventId: e21.id, userId: ahmedU.id,  text: 'I filmed 47 videos. This trip changed how I see Pakistan.' },
    { eventId: e23.id, userId: tariqU.id,  text: '9A* — Ahmed you absolute legend! Chachu is taking you out for dinner, your choice.' },
    { eventId: e23.id, userId: nadiaU.id,  text: 'We are all so proud! MashAllah tabarakAllah.' },
    { eventId: e23.id, userId: sanaU.id,   text: 'He studied so hard. Every late night paid off.' },
    { eventId: e25.id, userId: tariqU.id,  text: 'Three Generations — Sara you captured something beautiful.' },
    { eventId: e25.id, userId: saraU.id,   text: 'I painted it thinking of Dada. Dadi recognised his teacup.' },
    { eventId: e28.id, userId: tariqU.id,  text: 'Every Dua we read, he is in it. We love you Dada.' },
    { eventId: e28.id, userId: imranU.id,  text: 'He taught me what it means to be a man. Miss him every day.' },
    { eventId: e30.id, userId: tariqU.id,  text: 'LUMS Computer Science. Dada would have been so proud.' },
    { eventId: e30.id, userId: sanaU.id,   text: 'Dadi called me five times to tell me. Best news of the year.' },
  ]})

  await prisma.like.createMany({ data: [
    { userId: imranU.id,  targetType: 'EVENT', targetId: e1.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e1.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e1.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e2.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e2.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e3.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e3.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e4.id },
    { userId: saraU.id,   targetType: 'EVENT', targetId: e4.id },
    { userId: zaidU.id,   targetType: 'EVENT', targetId: e4.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e5.id },
    { userId: ahmedU.id,  targetType: 'EVENT', targetId: e5.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e6.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e6.id },
    { userId: zaidU.id,   targetType: 'EVENT', targetId: e6.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e7.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e7.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e7.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e7.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e8.id },
    { userId: saraU.id,   targetType: 'EVENT', targetId: e8.id },
    { userId: ahmedU.id,  targetType: 'EVENT', targetId: e8.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e9.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e9.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e9.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e13.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e13.id },
    { userId: zaidU.id,   targetType: 'EVENT', targetId: e13.id },
    { userId: testUser.id,targetType: 'EVENT', targetId: e13.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e13.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e18.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e18.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e18.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e19.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e19.id },
    { userId: zaidU.id,   targetType: 'EVENT', targetId: e19.id },
    { userId: saraU.id,   targetType: 'EVENT', targetId: e19.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e20.id },
    { userId: zaidU.id,   targetType: 'EVENT', targetId: e20.id },
    { userId: saraU.id,   targetType: 'EVENT', targetId: e20.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e21.id },
    { userId: ahmedU.id,  targetType: 'EVENT', targetId: e21.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e23.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e23.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e23.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e23.id },
    { userId: testUser.id,targetType: 'EVENT', targetId: e23.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e25.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e25.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e25.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e28.id },
    { userId: imranU.id,  targetType: 'EVENT', targetId: e28.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e28.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e28.id },
    { userId: sanaU.id,   targetType: 'EVENT', targetId: e28.id },
    { userId: tariqU.id,  targetType: 'EVENT', targetId: e30.id },
    { userId: nadiaU.id,  targetType: 'EVENT', targetId: e30.id },
    { userId: omarU.id,   targetType: 'EVENT', targetId: e30.id },
    { userId: testUser.id,targetType: 'EVENT', targetId: e30.id },
  ]})

  // ─────────────────────────────────────────────────────────────────────────
  // SHARMA FAMILY TREE — 3 generations, 15 persons
  // ─────────────────────────────────────────────────────────────────────────
  const sharmaTree = await prisma.familyTree.create({ data: { name: 'Sharma Family', timezone: 'Asia/Kolkata' }})
  const ST = sharmaTree.id

  const raj    = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id,
    firstName: 'Raj', lastName: 'Sharma', gender: 'MALE', dateOfBirth: new Date('1948-11-01'), isDeceased: true, profilePicUrl: avatar(7) }})
  const meena  = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id,
    firstName: 'Meena', lastName: 'Sharma', gender: 'FEMALE', dateOfBirth: new Date('1952-05-12'), profilePicUrl: avatar(23) }})
  const aryanP = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id, linkedUserId: aryanU.id,
    firstName: 'Aryan', lastName: 'Sharma', gender: 'MALE', dateOfBirth: new Date('1985-03-22'), profilePicUrl: aryanU.profilePicUrl }})
  const priyaP = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id, linkedUserId: priyaU.id,
    firstName: 'Priya', lastName: 'Sharma', gender: 'FEMALE', dateOfBirth: new Date('1988-07-14'), profilePicUrl: priyaU.profilePicUrl }})
  const raviP  = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id, linkedUserId: raviU.id,
    firstName: 'Ravi', lastName: 'Sharma', gender: 'MALE', dateOfBirth: new Date('1987-09-30'), profilePicUrl: raviU.profilePicUrl }})
  const kavyaP = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id, linkedUserId: kavyaU.id,
    firstName: 'Kavya', lastName: 'Sharma', gender: 'FEMALE', dateOfBirth: new Date('1990-01-18'), profilePicUrl: kavyaU.profilePicUrl }})
  const neelam = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id, linkedUserId: neelamU.id,
    firstName: 'Neelam', lastName: 'Sharma', gender: 'FEMALE', dateOfBirth: new Date('1990-08-25'), profilePicUrl: neelamU.profilePicUrl }})
  const suresh = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id,
    firstName: 'Suresh', lastName: 'Mehta', gender: 'MALE', dateOfBirth: new Date('1987-04-15'), profilePicUrl: avatar(53) }})
  const riya   = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id,
    firstName: 'Riya', lastName: 'Sharma', gender: 'FEMALE', dateOfBirth: new Date('2013-06-25'), profilePicUrl: avatar(29) }})
  const devP   = await prisma.person.create({ data: { familyTreeId: ST, createdById: aryanU.id, linkedUserId: devU.id,
    firstName: 'Dev', lastName: 'Sharma', gender: 'MALE', dateOfBirth: new Date('2015-05-15'), profilePicUrl: devU.profilePicUrl }})
  const ananya = await prisma.person.create({ data: { familyTreeId: ST, createdById: raviU.id,
    firstName: 'Ananya', lastName: 'Sharma', gender: 'FEMALE', dateOfBirth: new Date('2016-10-12'), profilePicUrl: avatar(36) }})
  const karan  = await prisma.person.create({ data: { familyTreeId: ST, createdById: raviU.id,
    firstName: 'Karan', lastName: 'Sharma', gender: 'MALE', dateOfBirth: new Date('2019-03-08'), profilePicUrl: avatar(63) }})
  const naina  = await prisma.person.create({ data: { familyTreeId: ST, createdById: kavyaU.id,
    firstName: 'Naina', lastName: 'Mehta', gender: 'FEMALE', dateOfBirth: new Date('2018-07-22'), profilePicUrl: avatar(38) }})
  const rohan  = await prisma.person.create({ data: { familyTreeId: ST, createdById: kavyaU.id,
    firstName: 'Rohan', lastName: 'Mehta', gender: 'MALE', dateOfBirth: new Date('2020-11-30'), profilePicUrl: avatar(66) }})

  await prisma.familyTree.update({ where: { id: ST }, data: { rootPersonId: raj.id } })

  const se: Array<{ from: string; to: string; type: 'PARENT' | 'SPOUSE' | 'SIBLING' }> = [
    { from: raj.id,   to: meena.id,  type: 'SPOUSE' },
    { from: raj.id,   to: aryanP.id, type: 'PARENT' }, { from: meena.id, to: aryanP.id, type: 'PARENT' },
    { from: raj.id,   to: raviP.id,  type: 'PARENT' }, { from: meena.id, to: raviP.id,  type: 'PARENT' },
    { from: raj.id,   to: kavyaP.id, type: 'PARENT' }, { from: meena.id, to: kavyaP.id, type: 'PARENT' },
    { from: aryanP.id, to: raviP.id,  type: 'SIBLING' },
    { from: aryanP.id, to: kavyaP.id, type: 'SIBLING' },
    { from: raviP.id,  to: kavyaP.id, type: 'SIBLING' },
    { from: aryanP.id, to: priyaP.id, type: 'SPOUSE' },
    { from: raviP.id,  to: neelam.id, type: 'SPOUSE' },
    { from: kavyaP.id, to: suresh.id, type: 'SPOUSE' },
    { from: aryanP.id, to: riya.id,  type: 'PARENT' }, { from: priyaP.id, to: riya.id,  type: 'PARENT' },
    { from: aryanP.id, to: devP.id,  type: 'PARENT' }, { from: priyaP.id, to: devP.id,  type: 'PARENT' },
    { from: riya.id,   to: devP.id,  type: 'SIBLING' },
    { from: raviP.id,  to: ananya.id, type: 'PARENT' }, { from: neelam.id, to: ananya.id, type: 'PARENT' },
    { from: raviP.id,  to: karan.id,  type: 'PARENT' }, { from: neelam.id, to: karan.id,  type: 'PARENT' },
    { from: ananya.id, to: karan.id,  type: 'SIBLING' },
    { from: kavyaP.id, to: naina.id,  type: 'PARENT' }, { from: suresh.id, to: naina.id,  type: 'PARENT' },
    { from: kavyaP.id, to: rohan.id,  type: 'PARENT' }, { from: suresh.id, to: rohan.id,  type: 'PARENT' },
    { from: naina.id,  to: rohan.id,  type: 'SIBLING' },
  ]
  for (const e of se) {
    await prisma.relationshipEdge.create({ data: { treeId: ST, fromPersonId: e.from, toPersonId: e.to, relationType: e.type }})
  }

  await prisma.familyMember.createMany({ data: [
    { userId: aryanU.id,  treeId: ST, role: 'SUPER_ADMIN' },
    { userId: raviU.id,   treeId: ST, role: 'ADMIN' },
    { userId: kavyaU.id,  treeId: ST, role: 'ADMIN' },
    { userId: priyaU.id,  treeId: ST, role: 'MEMBER' },
    { userId: neelamU.id, treeId: ST, role: 'MEMBER' },
    { userId: devU.id,    treeId: ST, role: 'MEMBER' },
  ]})

  // Sharma events (12)
  const sev = async (data: { type: string; title: string; desc: string; date: string; by: string }) =>
    prisma.event.create({ data: { treeId: ST, createdById: data.by, type: data.type as never,
      title: data.title, description: data.desc, date: new Date(data.date), visibility: 'FAMILY' }})

  const s1  = await sev({ type: 'WEDDING',     by: aryanU.id,  date: '2015-02-14', title: "Aryan & Priya's Wedding",
    desc: "A grand three-day celebration in Jaipur. Palace venue, 400 guests, and a baraat that became the talk of the neighbourhood. Mumma cried the entire sangeet." })
  const s2  = await sev({ type: 'WEDDING',     by: raviU.id,   date: '2017-11-22', title: "Ravi & Neelam's Wedding",
    desc: "A winter wedding in Delhi — marigolds everywhere, old Bollywood songs, and Dadi's blessing from the first photo. Everyone danced until 4am." })
  const s3  = await sev({ type: 'WEDDING',     by: aryanU.id,  date: '2019-05-18', title: "Kavya & Suresh's Wedding",
    desc: "Kavya's wedding was the most colourful one yet — destination wedding in Udaipur. The lake palace backdrop made every photo look like a film. Papa would have loved it." })
  const s4  = await sev({ type: 'BIRTHDAY',    by: priyaU.id,  date: '2025-05-15', title: "Dev's 10th Birthday",
    desc: "Dev wanted a dinosaur themed party. We arranged a T-Rex cake that scared his own cousin. He loved it. Papa would have been so proud." })
  const s5  = await sev({ type: 'BIRTHDAY',    by: raviU.id,   date: '2024-06-25', title: "Riya Turns 11",
    desc: "Riya requested a painting party — we set up canvases in the garden and all painted together. Her piece was the best of the lot by far." })
  const s6  = await sev({ type: 'BIRTHDAY',    by: aryanU.id,  date: '2024-10-12', title: "Ananya's 8th Birthday",
    desc: "Ananya wanted a mermaid theme and got an entire ocean in the living room — blue balloons, shell decorations, and a cake with an actual pearl on top." })
  const s7  = await sev({ type: 'GATHERING',   by: raviU.id,   date: '2023-11-12', title: "Diwali Reunion 2023",
    desc: "First Diwali back home in Jaipur after three years. Nani made halwa from Dada's recipe. Riya won the rangoli competition for the second year running." })
  const s8  = await sev({ type: 'GATHERING',   by: aryanU.id,  date: '2024-10-31', title: "Diwali 2024 — Four Families",
    desc: "All four Sharma families under one roof — first time in 6 years. The kids set off so many sparklers the neighbours thought we were celebrating a cricket win." })
  const s9  = await sev({ type: 'GATHERING',   by: kavyaU.id,  date: '2024-01-01', title: "New Year 2024 — Mumbai Terrace",
    desc: "Kavya hosted New Year on her terrace in Mumbai. Countdown at midnight, the entire city lit up below. Rohan fell asleep at 10pm and missed all of it." })
  const s10 = await sev({ type: 'TRIP',        by: aryanU.id,  date: '2022-04-01', title: "Goa Family Trip 2022",
    desc: "Five days in Goa — Riya collected every shell she could find. Dev ate his weight in coconut ice cream. Best memories." })
  const s11 = await sev({ type: 'TRIP',        by: raviU.id,   date: '2024-06-10', title: "Manali Summer 2024",
    desc: "Three Sharma families drove to Manali. Snow in June — the kids were convinced they'd found the North Pole. Karan built a snowman taller than himself." })
  const s12 = await sev({ type: 'ACHIEVEMENT', by: aryanU.id,  date: '2024-03-20', title: "Riya Wins National Art Contest",
    desc: "Riya's painting 'Dadi's Garden' won the national children's art contest. She's 10. Mumma framed the certificate and hung it in three rooms." })

  await tag(s1.id,  aryanP.id, priyaP.id, raj.id, meena.id, raviP.id, kavyaP.id)
  await tag(s2.id,  raviP.id, neelam.id, meena.id, aryanP.id, priyaP.id, kavyaP.id)
  await tag(s3.id,  kavyaP.id, suresh.id, meena.id, aryanP.id, raviP.id)
  await tag(s4.id,  devP.id, aryanP.id, priyaP.id, riya.id)
  await tag(s5.id,  riya.id, aryanP.id, priyaP.id, devP.id)
  await tag(s6.id,  ananya.id, raviP.id, neelam.id, karan.id, riya.id, devP.id)
  await tag(s7.id,  meena.id, aryanP.id, priyaP.id, raviP.id, neelam.id, kavyaP.id, suresh.id, riya.id, devP.id, ananya.id, karan.id)
  await tag(s8.id,  meena.id, aryanP.id, priyaP.id, raviP.id, neelam.id, kavyaP.id, suresh.id, riya.id, devP.id, ananya.id, karan.id, naina.id, rohan.id)
  await tag(s9.id,  kavyaP.id, suresh.id, naina.id, aryanP.id, priyaP.id)
  await tag(s10.id, aryanP.id, priyaP.id, riya.id, devP.id)
  await tag(s11.id, raviP.id, neelam.id, ananya.id, karan.id, aryanP.id, priyaP.id, riya.id, devP.id)
  await tag(s12.id, riya.id, aryanP.id, priyaP.id, meena.id)

  await media(s1.id,  aryanU.id, [{ seed: 'sharmaWed15a',  cap: 'Baraat procession — the whole village came'  }, { seed: 'sharmaWed15b',  cap: 'Sangeet night — all siblings danced'     }, { seed: 'sharmaWed15c',  cap: 'Priya\'s entry — everyone in tears'          }])
  await media(s2.id,  raviU.id,  [{ seed: 'raviWed17a',   cap: 'Winter wedding — marigolds everywhere'       }, { seed: 'raviWed17b',   cap: 'Dancing until 4am — Bollywood classics'   }])
  await media(s3.id,  kavyaU.id, [{ seed: 'kavyaWed19a',  cap: 'Lake palace backdrop — every shot a painting'}, { seed: 'kavyaWed19b',  cap: 'Haldi ceremony — Kavya glowing'           }])
  await media(s4.id,  priyaU.id, [{ seed: 'devBday25a',   cap: 'T-Rex cake — terrifyingly good'              }, { seed: 'devBday25b',   cap: 'Dev saves the penalty kick'               }])
  await media(s5.id,  raviU.id,  [{ seed: 'riyaBday24a',  cap: 'Painting party — canvases in the garden'    }, { seed: 'riyaBday24b',  cap: 'Riya\'s masterpiece — best of the day'     }])
  await media(s6.id,  neelamU.id,[{ seed: 'ananya8a',     cap: 'Ocean-themed living room — 50 blue balloons'}, { seed: 'ananya8b',     cap: 'The pearl cake — Ananya couldn\'t believe it'}])
  await media(s7.id,  raviU.id,  [{ seed: 'diwali23sa',   cap: 'Rangoli — Riya wins again!'                 }, { seed: 'diwali23sb',   cap: 'Nani\'s halwa from Dada\'s recipe'           }, { seed: 'diwali23sc',   cap: 'Fireworks on the terrace'                   }])
  await media(s8.id,  aryanU.id, [{ seed: 'diwali24a',    cap: 'Four families — first time in 6 years'      }, { seed: 'diwali24b',    cap: 'The kids with their sparklers'             }])
  await media(s9.id,  kavyaU.id, [{ seed: 'newyear24a',   cap: 'Mumbai skyline at midnight'                 }, { seed: 'newyear24b',   cap: 'Rohan asleep at 10pm — the legend'        }])
  await media(s10.id, aryanU.id, [{ seed: 'goa22sa',      cap: 'Sunset at Baga Beach'                       }, { seed: 'goa22sb',      cap: 'Riya\'s shell collection — 47 in 5 days'   }, { seed: 'goa22sc',      cap: 'Dev and his coconut ice cream'              }])
  await media(s11.id, raviU.id,  [{ seed: 'manali24a',    cap: 'Karan\'s snowman — taller than himself'     }, { seed: 'manali24b',    cap: 'Snow in June — convinced they\'d found the North Pole'}])
  await media(s12.id, aryanU.id, [{ seed: 'riyaArt24a',   cap: "Riya with her prize certificate"             }, { seed: 'riyaArt24b',   cap: "Dadi's Garden — the winning painting"      }])

  await prisma.comment.createMany({ data: [
    { eventId: s1.id,  userId: raviU.id,   text: 'Aryan bhai, the baraat was legendary. Still the best wedding in the family.' },
    { eventId: s1.id,  userId: priyaU.id,  text: 'Ten years on and I remember every moment. Best day of my life.' },
    { eventId: s1.id,  userId: kavyaU.id,  text: 'I cried at Sangeet. Do not tell Aryan bhai.' },
    { eventId: s2.id,  userId: aryanU.id,  text: 'Ravi bhai dancing until 4am — I have the video and I am keeping it forever.' },
    { eventId: s2.id,  userId: neelamU.id, text: 'That wedding was a dream. I love this family.' },
    { eventId: s3.id,  userId: raviU.id,   text: 'Udaipur was breathtaking. Kavya didi you looked incredible.' },
    { eventId: s3.id,  userId: priyaU.id,  text: 'Papa would have been so proud. He always said Kavya was his artist.' },
    { eventId: s4.id,  userId: priyaU.id,  text: 'My little boy is 10. I cannot believe it. Time is flying.' },
    { eventId: s4.id,  userId: aryanU.id,  text: 'That T-Rex cake was terrifyingly good. He sleeps with the toy version now.' },
    { eventId: s5.id,  userId: aryanU.id,  text: 'Riya\'s painting was genuinely better than all the adults. Talent is no joke.' },
    { eventId: s7.id,  userId: priyaU.id,  text: 'Riya has won the rangoli contest two years in a row. Our little artist.' },
    { eventId: s7.id,  userId: aryanU.id,  text: 'Nani made the same halwa from Dada\'s recipe. One bite and we were all kids again.' },
    { eventId: s7.id,  userId: kavyaU.id,  text: 'This is what Diwali is supposed to feel like. Together.' },
    { eventId: s8.id,  userId: raviU.id,   text: 'Four families. Haven\'t seen everyone together in 6 years. Worth every hour of the drive.' },
    { eventId: s10.id, userId: priyaU.id,  text: 'Dev counted his shell collection — 47 shells in 5 days. A new record.' },
    { eventId: s10.id, userId: raviU.id,   text: 'That sunset on the last evening was something else. Cannot wait to go again.' },
    { eventId: s11.id, userId: neelamU.id, text: 'Karan built a snowman and refused to leave it. We nearly drove home without him.' },
    { eventId: s12.id, userId: raviU.id,   text: 'National contest. She is 10. We are all outdone.' },
    { eventId: s12.id, userId: priyaU.id,  text: 'I cried when I saw the painting. She painted Nani\'s garden from memory.' },
  ]})

  await prisma.like.createMany({ data: [
    { userId: raviU.id,   targetType: 'EVENT', targetId: s1.id },
    { userId: kavyaU.id,  targetType: 'EVENT', targetId: s1.id },
    { userId: priyaU.id,  targetType: 'EVENT', targetId: s2.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s2.id },
    { userId: kavyaU.id,  targetType: 'EVENT', targetId: s2.id },
    { userId: raviU.id,   targetType: 'EVENT', targetId: s3.id },
    { userId: priyaU.id,  targetType: 'EVENT', targetId: s3.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s4.id },
    { userId: raviU.id,   targetType: 'EVENT', targetId: s5.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s5.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s6.id },
    { userId: priyaU.id,  targetType: 'EVENT', targetId: s6.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s7.id },
    { userId: raviU.id,   targetType: 'EVENT', targetId: s7.id },
    { userId: kavyaU.id,  targetType: 'EVENT', targetId: s7.id },
    { userId: priyaU.id,  targetType: 'EVENT', targetId: s8.id },
    { userId: raviU.id,   targetType: 'EVENT', targetId: s8.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s10.id },
    { userId: priyaU.id,  targetType: 'EVENT', targetId: s10.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s11.id },
    { userId: priyaU.id,  targetType: 'EVENT', targetId: s11.id },
    { userId: neelamU.id, targetType: 'EVENT', targetId: s11.id },
    { userId: aryanU.id,  targetType: 'EVENT', targetId: s12.id },
    { userId: raviU.id,   targetType: 'EVENT', targetId: s12.id },
    { userId: kavyaU.id,  targetType: 'EVENT', targetId: s12.id },
    { userId: neelamU.id, targetType: 'EVENT', targetId: s12.id },
  ]})

  // ─── Summary ──────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(), prisma.familyTree.count(), prisma.person.count(),
    prisma.relationshipEdge.count(), prisma.event.count(), prisma.media.count(),
    prisma.comment.count(), prisma.like.count(), prisma.familyMember.count(),
  ])
  const [users, trees, persons, edges, events, medias, comments, likes, members] = counts

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('SEEDED')
  console.log(`  Users: ${users}  Trees: ${trees}  Persons: ${persons}  Members: ${members}`)
  console.log(`  Edges: ${edges}  Events: ${events}  Media: ${medias}`)
  console.log(`  Comments: ${comments}  Likes: ${likes}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('TEST LOGIN:  9581469690 / 123456  (testuser, Khan Family)')
  console.log('ADMIN LOGIN: +923001234567 / demo1234  (tariq_khan)')
  console.log(`KHAN TREE:   ${khanTree.id}`)
  console.log(`SHARMA TREE: ${sharmaTree.id}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(console.error).finally(() => prisma.$disconnect())
