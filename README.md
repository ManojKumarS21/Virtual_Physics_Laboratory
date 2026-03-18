# 🌐 Virtual Physics & Chemistry Laboratory

A state-of-the-art, interactive AR-powered science laboratory for immersive learning. Perform complex physics and chemistry experiments in a high-fidelity 3D environment with real-time feedback, guided instructions, and Augmented Reality integration.

---

## 🔬 Physics Laboratory (Meter Bridge)

The Physics module features a highly detailed simulation of the **Meter Bridge Experiment** to determine unknown resistance.

### 🌟 Key Features
- **🎯 Dynamic Simulation**: Accurate physics-based calculations for galvanometer deflection and null-point detection.
- **🛠️ Interactive Components**: 
  - **Galvanometer**: Real-time μA readings and needle movement.
  - **Resistance Box**: Clickable plugs to set reference resistance ($R$).
  - **Jockey & Meter Bridge**: Slide the jockey along the wire to find the balance length ($l$).
  - **Circuitry**: Interactive wire connection system between terminals.
- **📊 Scientific HUD**: Real-time display of Current Length, Resistance ($R$), and calculated Unknown Resistance ($X$).
- **📔 Observation System**: Record trials to a summary table, automatically calculating Mean Values and **Percentage Error**.

### 🎮 Interactive Modes
- **🧭 Guided Tour**: A 14-step narrated walkthrough introducing every instrument and the basic setup.
- **💪 Workout Mode**: A 7-step "test" mode that validates your connections in real-time, providing instant voice feedback for correct/incorrect actions.
- **🧪 Practice Mode**: Open exploration to perform experiments at your own pace.

---

## 🧪 Chemistry Laboratory (Ionic Analysis)

The Chemistry module provides a comprehensive platform for **Salt Analysis** and qualitative inorganic chemistry.

### 🌟 Key Features
- **⚗️ Extensive Apparatus**: Over 25+ 3D models including Beakers, Flasks, Bunsen Burners, Test Tubes (with holders), Droppers, and Spatulas.
- **🧪 Experiment Library**:
  - **Chloride Ion Test** (AgNO3 reaction - white curdy precipitate)
  - **Sulphate Ion Test** (BaCl2 reaction - white precipitate)
  - **Copper(II) Ion Test** (NH4OH reaction - deep blue complex)
  - **Iron(III) Ion Test** (KSCN reaction - blood-red complex)
  - **Chromate Ion Test** (BaCl2 reaction - yellow precipitate)
  - **Ammonium Ion Test** (NaOH & heating - Ammonia gas evolution)
- **🔥 Realistic Effects**: Dynamic particle systems for gas evolution, precipitate formation, and Bunsen burner flames.
- **🖐️ Interactive Handling**: Drag-and-drop apparatus, pour chemicals, and use droppers for precise titration.

### 🎮 Interactive Modes
- **🧭 Guided Tour**: Multi-language narrated walkthrough of equipment and a full demonstration of the Chloride test.
- **🧪 Practice Session**: Choose from 6 different ionic tests with step-by-step instructions and observation logs.

---

## 🤳 Augmented Reality (AR)

Experience the lab in your physical space using **WebXR**.

- **🚀 Hit-Testing & Placement**: Detect floors or tables and tap to spawn the entire laboratory setup.
- **📱 QR Bridge**: Generate a bridgeable link using your local IP to quickly switch from desktop to mobile AR.
- **📐 Scale & Orientation**: 1:1 scale models designed for realistic physical interaction.

---

## 🌍 Accessibility & Localization

- **🔊 Voice Guidance**: High-quality Text-to-Speech (TTS) narration for all guided tours and feedback systems.
- **🇮🇳 Multi-Language Support**: Complete support for:
  - **English**
  - **Hindi (हिंदी)**
  - **Marathi (मराठी)**
  - **Telugu (తెలుగు)**

---

## 🛠️ Tech Stack

- **Core**: [Next.js 14](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/)
- **3D Engine**: [Three.js](https://threejs.org/) via [React Three Fiber](https://r3f.docs.pmnd.rs/)
- **AR/VR**: [React Three XR](https://github.com/pmndrs/react-xr) (WebXR)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Physics) & [React Context](https://react.dev/learn/passing-data-deeply-with-context) (Chemistry)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **UI & Icons**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Installation
1. Clone the repository: `git clone https://github.com/ManojKumarS21/Virtual_Physics_Laboratory.git`
2. Navigate to the frontend: `cd frontend`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`

### Project Structure
- `/frontend/src/app`: Application pages (Physics Lab, Chemistry Lab, AR).
- `/frontend/src/components`: UI components and 3D models.
- `/frontend/src/hooks` & `/frontend/src/lib`: State management and physics/chemistry logic.
- `/frontend/public`: Static assets and textures.

---

## 🤝 Contributing
Contributions make the laboratory better! Feel free to open issues or submit pull requests.

## 📄 License
Licensed under the MIT License.

---
*Created with passion for interactive education by the Virtual Lab Team.*
