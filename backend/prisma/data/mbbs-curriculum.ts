export const mbbsCurriculum = [
  {
    year: 1,
    subjects: [
      {
        name: "Anatomy",
        code: "ANAT",
        description: "Study of the structure of the human body",
        iconUrl: "/images/subjects/anatomy.png",
        topics: [
          {
            name: "Gross Anatomy",
            children: [
              { name: "Limbs" },
              { name: "Thorax" },
              { name: "Abdomen" },
              { name: "Head & Neck" },
              { name: "Brain" },
              { name: "Perineum" }
            ]
          },
          { name: "Histology", description: "Microscopic structure of tissues & organs" },
          { name: "Embryology", description: "Development of organ systems, congenital anomalies" },
          { name: "Neuroanatomy", description: "Brainstem, cerebellum, cortex, tracts" },
          { name: "Radiological Anatomy", description: "X-ray, CT, MRI orientation" }
        ]
      },
      {
        name: "Physiology",
        code: "PHYS",
        description: "Study of the normal functions of living organisms",
        iconUrl: "/images/subjects/physiology.png",
        topics: [
          { name: "General Physiology", description: "Homeostasis, body fluids" },
          { name: "Nerve & Muscle", description: "Membrane potentials, muscle contraction" },
          { name: "Cardiovascular System", description: "ECG, cardiac output, BP regulation" },
          { name: "Respiratory System", description: "Mechanics, gas exchange" },
          { name: "Renal System", description: "Nephron, acid-base balance" },
          { name: "Gastrointestinal", description: "Digestion, absorption, GI hormones" },
          { name: "Endocrine", description: "Pituitary, thyroid, adrenal, pancreas" },
          { name: "Reproductive", description: "Menstrual cycle, pregnancy, lactation" },
          { name: "CNS & Special Senses", description: "Reflexes, vision, hearing, sleep" }
        ]
      },
      {
        name: "Biochemistry",
        code: "BIO",
        description: "Chemical processes within and related to living organisms",
        iconUrl: "/images/subjects/biochemistry.png",
        topics: [
          { name: "Biomolecules", description: "Carbohydrates, lipids, proteins, nucleic acids" },
          { name: "Enzymology", description: "Kinetics, inhibition, isoenzymes" },
          { name: "Metabolism", description: "Glycolysis, Krebs cycle, β-oxidation" },
          { name: "Vitamins & Minerals", description: "Roles, deficiency diseases" },
          { name: "Molecular Biology", description: "DNA replication, transcription, translation" },
          { name: "Clinical Biochemistry", description: "Liver/kidney/thyroid tests, diabetes profile" }
        ]
      }
    ]
  },
  {
    year: 2,
    subjects: [
      {
        name: "Pathology",
        code: "PATH",
        description: "Study of the causes and effects of disease or injury",
        iconUrl: "/images/subjects/pathology.png",
        topics: [
          { name: "General Pathology", description: "Cell injury, inflammation, repair, neoplasia" },
          { name: "Haematology", description: "Anaemias, leukaemias, coagulation disorders" },
          { name: "Systemic Pathology", description: "Cardiovascular, renal, hepatic, endocrine, CNS" }
        ]
      },
      {
        name: "Microbiology",
        code: "MICRO",
        description: "Study of microscopic organisms",
        iconUrl: "/images/subjects/microbiology.png",
        topics: [
          { name: "Bacteriology" },
          { name: "Virology" },
          { name: "Mycology" },
          { name: "Parasitology" },
          { name: "Immunology", description: "Antigen-antibody reactions, vaccines" },
          { name: "Sterilisation & Disinfection", description: "Sterilisation, disinfection, infection control" }
        ]
      },
      {
        name: "Pharmacology",
        code: "PHARM",
        description: "Study of drug action",
        iconUrl: "/images/subjects/pharmacology.png",
        topics: [
          { name: "General Pharmacology", description: "ADME, receptors, dose-response" },
          { name: "CNS Drugs" },
          { name: "CVS Drugs" },
          { name: "Endocrine Drugs" },
          { name: "Chemotherapy & Antimicrobials" },
          { name: "Rational Prescribing", description: "Rational prescribing, Adverse reactions" }
        ]
      },
      {
        name: "Forensic Medicine & Toxicology",
        code: "FMT",
        description: "Application of medical knowledge to legal questions",
        topics: [
          { name: "Medico-legal Procedures", description: "Medico-legal procedures, autopsy, sexual offences" },
          { name: "Toxicology", description: "Poisons, drugs, pesticides" },
          { name: "Ethics & Law", description: "IPC, CrPC, MCI Code" }
        ]
      },
      {
        name: "Community Medicine (Part 1)",
        code: "CM1",
        description: "Health of populations",
        topics: [
          { name: "Epidemiology & Biostatistics" },
          { name: "Demography & Health Programmes" },
          { name: "Environmental Sanitation & Nutrition" }
        ]
      }
    ]
  },
  {
    year: 3,
    subjects: [
      {
        name: "General Medicine",
        code: "MED",
        description: "Diagnosis and treatment of diseases",
        topics: [
          { name: "Clinical Basics", description: "Clinical history taking, physical examination" },
          { name: "Systemic Diseases", description: "CVS, CNS, GIT, Endocrine" },
          { name: "Emergencies", description: "Shock, MI, Coma, Poisoning" }
        ]
      },
      {
        name: "Paediatrics",
        code: "PED",
        description: "Medical care of infants, children, and adolescents",
        topics: [
          { name: "Growth & Development", description: "Growth & development, neonatology" },
          { name: "Infectious Diseases & Nutrition" }
        ]
      },
      {
        name: "General Surgery",
        code: "SURG",
        description: "Surgical treatment of diseases",
        topics: [
          { name: "General Principles", description: "Wound healing, shock, sepsis, burns" },
          { name: "Systemic Surgery", description: "GIT, breast, thyroid, urology" },
          { name: "Oncology & Trauma" }
        ]
      },
      {
        name: "Obstetrics & Gynaecology",
        code: "OBGY",
        description: "Childbirth and female reproductive system",
        topics: [
          { name: "Obstetrics", description: "Antenatal, intrapartum, postnatal care, Normal & abnormal labour" },
          { name: "Gynaecology", description: "Menstrual disorders, infertility, neoplasms, contraception" }
        ]
      },
      {
        name: "Orthopaedics",
        code: "ORTHO",
        description: "Musculoskeletal system",
        topics: [
          { name: "Traumatology", description: "Fractures, dislocations" },
          { name: "Bone & Joint Diseases", description: "Bone infections, spinal disorders, joint diseases" }
        ]
      },
      {
        name: "ENT",
        code: "ENT",
        description: "Ear, Nose, and Throat",
        topics: [
          { name: "Ear", description: "Hearing loss, otitis media, vertigo" },
          { name: "Nose", description: "Sinusitis, epistaxis" },
          { name: "Throat", description: "Tonsillitis, laryngeal diseases" }
        ]
      },
      {
        name: "Ophthalmology",
        code: "OPHTH",
        description: "Eye disorders",
        topics: [
          { name: "Refraction & Lens", description: "Refraction, cataract" },
          { name: "Glaucoma & Conjunctiva", description: "Glaucoma, Conjunctivitis" },
          { name: "Ocular Trauma & Squint" }
        ]
      },
      {
        name: "Dermatology & Venereology",
        code: "DERM",
        description: "Skin diseases and STIs",
        topics: [
          { name: "Skin Infections & Eczema" },
          { name: "Psoriasis & Leprosy" },
          { name: "Sexually Transmitted Infections" }
        ]
      },
      {
        name: "Psychiatry",
        code: "PSYCH",
        description: "Mental disorders",
        topics: [
          { name: "Mood & Anxiety Disorders", description: "Anxiety, depression" },
          { name: "Psychosis" },
          { name: "Substance Abuse" }
        ]
      },
      {
        name: "Radiology & Anaesthesiology",
        code: "RAD_ANES",
        description: "Imaging and Anaesthesia",
        topics: [
          { name: "Radiology", description: "Imaging principles, X-ray, CT, MRI basics" },
          { name: "Anaesthesiology", description: "Anaesthesia types, pain management" }
        ]
      }
    ]
  }
];
