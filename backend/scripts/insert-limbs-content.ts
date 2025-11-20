import { addContent } from './add-content';

const upperLimbContent = `
# Gross Anatomy: Upper Limb

The upper limb is a complex structure adapted for versatility and movement. It is divided into the shoulder, arm, forearm, and hand.

## 1. Osteology (Bones)
*   **Clavicle (Collarbone):** S-shaped bone connecting the upper limb to the trunk.
*   **Scapula (Shoulder Blade):** Triangular flat bone on the posterior chest wall. Key features: Spine, Acromion, Coracoid process, Glenoid cavity.
*   **Humerus:** The bone of the arm. Key features: Head, Greater/Lesser tubercles, Surgical neck (common fracture site), Epicondyles.
*   **Radius & Ulna:** Bones of the forearm. Radius is lateral (thumb side), Ulna is medial.
*   **Hand Bones:**
    *   **Carpals (8):** Scaphoid, Lunate, Triquetrum, Pisiform, Trapezium, Trapezoid, Capitate, Hamate. (*Mnemonic: She Looks Too Pretty Try To Catch Her*)
    *   **Metacarpals (5):** Bones of the palm.
    *   **Phalanges (14):** Bones of the fingers.

## 2. Arthrology (Joints)
*   **Glenohumeral Joint (Shoulder):** Ball-and-socket. High mobility, low stability. Stabilized by the Rotator Cuff.
*   **Elbow Joint:** Hinge joint. Flexion/Extension.
*   **Radioulnar Joints:** Pivot joints. Pronation/Supination.
*   **Wrist Joint:** Ellipsoid joint.

## 3. Myology (Muscles)
*   **Pectoral Region:** Pectoralis Major (Adduction, Medial rotation), Pectoralis Minor.
*   **Shoulder Region:** Deltoid (Abduction), Rotator Cuff (*SITS*: Supraspinatus, Infraspinatus, Teres Minor, Subscapularis).
*   **Arm - Anterior (Flexors):** Biceps Brachii, Brachialis, Coracobrachialis. (Nerve: Musculocutaneous)
*   **Arm - Posterior (Extensors):** Triceps Brachii. (Nerve: Radial)
*   **Forearm:** Divided into Anterior (Flexor/Pronator) and Posterior (Extensor/Supinator) compartments.
*   **Hand:** Thenar (Thumb), Hypothenar (Little finger), Lumbricals, Interossei.

## 4. Angiology (Blood Supply)
*   **Subclavian Artery** → **Axillary Artery** (at 1st rib) → **Brachial Artery** (at Teres Major) → Bifurcates into **Radial** & **Ulnar Arteries** (at Cubital Fossa).
*   **Superficial Veins:** Cephalic (Lateral), Basilic (Medial), connected by Median Cubital Vein (Venipuncture site).

## 5. Neurology (Nerves)
*   **Brachial Plexus (C5-T1):** Network supplying the upper limb.
    *   **Musculocutaneous:** Anterior arm.
    *   **Axillary:** Deltoid.
    *   **Radial:** Posterior arm/forearm (Extensors). Injury: *Wrist Drop*.
    *   **Median:** Anterior forearm (Flexors), Thenar muscles. Injury: *Carpal Tunnel Syndrome*, *Ape Hand*.
    *   **Ulnar:** Intrinsic hand muscles. Injury: *Claw Hand*.

## Clinical Correlations
*   **Erb's Palsy:** Injury to upper trunk (C5-C6). *Waiter's tip position*.
*   **Klumpke's Palsy:** Injury to lower trunk (C8-T1). *Claw hand*.
*   **Fracture of Humerus:**
    *   Surgical Neck: Axillary nerve damage.
    *   Mid-shaft: Radial nerve damage.
    *   Supracondylar: Median nerve damage.
`;

const upperLimbSummary = `
*   **Bones:** Clavicle, Scapula, Humerus, Radius, Ulna, Carpals (8), Metacarpals (5), Phalanges (14).
*   **Joints:** Shoulder (Ball & Socket), Elbow (Hinge), Wrist (Ellipsoid).
*   **Muscles:** Anterior Arm (Flexors - Musculocutaneous n.), Posterior Arm (Extensors - Radial n.).
*   **Nerves:** Brachial Plexus (C5-T1). Radial (Extensors), Median (Flexors), Ulnar (Hand).
*   **Clinical:** Erb's Palsy (C5-C6), Klumpke's Palsy (C8-T1), Wrist Drop (Radial n.), Claw Hand (Ulnar n.).
`;

const lowerLimbContent = `
# Gross Anatomy: Lower Limb

The lower limb is adapted for weight-bearing and locomotion. It consists of the gluteal region, thigh, leg, and foot.

## 1. Osteology (Bones)
*   **Hip Bone:** Ilium, Ischium, Pubis. Fused at Acetabulum.
*   **Femur:** Longest and strongest bone. Key features: Head, Neck (common fracture), Greater/Lesser Trochanters.
*   **Patella:** Kneecap (Sesamoid bone).
*   **Tibia:** Medial, weight-bearing bone of leg.
*   **Fibula:** Lateral, non-weight-bearing. Muscle attachment.
*   **Foot Bones:**
    *   **Tarsals (7):** Talus, Calcaneus (Heel), Navicular, Cuboid, Cuneiforms (3).
    *   **Metatarsals (5) & Phalanges (14).**

## 2. Arthrology (Joints)
*   **Hip Joint:** Ball-and-socket. Very stable.
*   **Knee Joint:** Modified hinge joint. Menisci (shock absorbers), Cruciate Ligaments (ACL, PCL - stability).
*   **Ankle Joint:** Hinge joint. Dorsiflexion/Plantarflexion.

## 3. Myology (Muscles)
*   **Gluteal Region:** Gluteus Maximus (Extension), Medius/Minimus (Abduction - prevent pelvic tilt).
*   **Thigh - Anterior (Extensors):** Quadriceps Femoris, Sartorius. (Nerve: Femoral)
*   **Thigh - Medial (Adductors):** Adductor Longus, Magnus, Brevis. (Nerve: Obturator)
*   **Thigh - Posterior (Flexors/Hamstrings):** Semitendinosus, Semimembranosus, Biceps Femoris. (Nerve: Sciatic)
*   **Leg - Anterior:** Tibialis Anterior (Dorsiflexion). (Nerve: Deep Peroneal)
*   **Leg - Lateral:** Peroneus Longus/Brevis (Eversion). (Nerve: Superficial Peroneal)
*   **Leg - Posterior:** Gastrocnemius, Soleus (Plantarflexion). (Nerve: Tibial)

## 4. Angiology (Blood Supply)
*   **Femoral Artery** (continuation of External Iliac) → **Popliteal Artery** (behind knee) → Bifurcates into **Anterior** & **Posterior Tibial Arteries**.
*   **Great Saphenous Vein:** Longest vein, used for grafts.

## 5. Neurology (Nerves)
*   **Lumbar Plexus (L1-L4) & Sacral Plexus (L4-S4).**
*   **Femoral Nerve:** Anterior thigh.
*   **Obturator Nerve:** Medial thigh.
*   **Sciatic Nerve:** Posterior thigh. Splits into Tibial & Common Peroneal.
*   **Common Peroneal Nerve:** Neck of fibula. Injury: *Foot Drop*.

## Clinical Correlations
*   **Trendelenburg Sign:** Weakness of Gluteus Medius/Minimus. Pelvis drops on contralateral side.
*   **ACL Tear:** Anterior Drawer Sign positive.
*   **Foot Drop:** Injury to Common Peroneal Nerve.
*   **Varicose Veins:** Dilatation of superficial veins.
`;

const lowerLimbSummary = `
*   **Bones:** Hip, Femur, Patella, Tibia, Fibula, Tarsals (7).
*   **Joints:** Hip (Ball & Socket), Knee (Hinge), Ankle (Hinge).
*   **Muscles:** Quadriceps (Extensors - Femoral n.), Hamstrings (Flexors - Sciatic n.), Adductors (Obturator n.).
*   **Nerves:** Sciatic (largest), Femoral, Obturator, Common Peroneal.
*   **Clinical:** Foot Drop (Common Peroneal n.), Trendelenburg Sign (Gluteus Medius), ACL Tear.
`;

async function main() {
  await addContent({
    topicName: 'Limbs',
    title: 'Gross Anatomy of the Upper Limb',
    content: upperLimbContent,
    summary: upperLimbSummary,
    imageUrl: '/images/subjects/upper_limb_anatomy.png',
    source: 'Kenhub, TeachMeAnatomy',
  });

  await addContent({
    topicName: 'Limbs',
    title: 'Gross Anatomy of the Lower Limb',
    content: lowerLimbContent,
    summary: lowerLimbSummary,
    imageUrl: '/images/subjects/lower_limb_anatomy.png',
    source: 'Kenhub, TeachMeAnatomy',
  });
}

main().catch(console.error);
