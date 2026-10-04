# Traffic Flow Theory Interactive Learning Tool

An interactive web application for learning and exploring traffic flow theory through dynamic visualizations and simulations.

![Traffic Flow Theory](https://img.shields.io/badge/Traffic-Flow-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## 🌐 Live Demo

**Try it now:** [https://bfb3511e-7d47-4a06-9acd-92ecfb584ea7.preview.qwenlm.io/](https://bfb3511e-7d47-4a06-9acd-92ecfb584ea7.preview.qwenlm.io/)

> ⚠️ **Note:** This is a temporary preview link that may expire. For long-term access, please clone the repository and run it locally (see [Getting Started](#-getting-started) below).

No installation required! Access the interactive traffic flow theory learning tool directly in your browser.

## 🚗 Overview

This interactive web application demonstrates fundamental traffic flow theory through dynamic visualizations and simulations. Users can explore the relationships between traffic density, speed, flow, and travel time by adjusting parameters and observing real-time changes in both the road simulation and fundamental diagrams.

The app implements three classical speed-density models (Greenshields, Greenberg, and Underwood) with default parameters based on the Highway Capacity Manual and empirical research. It serves as an educational tool for understanding traffic engineering concepts and the mathematical foundations of traffic flow analysis.

## ✨ Key Features

- **Real-time animated road simulation** with realistic car-following behavior
- **Interactive fundamental diagrams** (Flow-Density, Speed-Density, Speed-Flow, Travel Time)
- **Multiple speed-density models** with theoretical foundations:
  - Greenshields (1935) - Linear model
  - Greenberg (1959) - Logarithmic model
  - Underwood (1961) - Exponential model
- **Adjustable parameters**: free-flow speed, jam density, road length, number of lanes
- **Visual feedback** showing traffic regimes and level of service
- **Responsive design** that works on desktop and mobile devices

## 🎯 How to Use

1. **Adjust Traffic Density**: Use the slider or click on any chart to set the traffic density
2. **Modify Parameters**: Change free-flow speed, jam density, road length, or number of lanes
3. **Switch Models**: Compare different speed-density relationships (Greenshields, Greenberg, Underwood)
4. **Observe Changes**: Watch the road simulation and fundamental diagrams update in real-time
5. **Explore Theory**: Click the "Theory" button to learn about fundamental traffic flow concepts

## 🛠️ Technical Stack

- **React 18.3** - UI framework
- **TypeScript 5.7** - Type safety
- **Tailwind CSS 4.0** - Styling
- **Recharts** - Data visualization
- **Vite** - Build tool

## 📊 Traffic Flow Theory Background

### Fundamental Equation

The core relationship in traffic flow theory:

```
q = k × v
```

Where:
- **q** = Flow (veh/h/lane)
- **k** = Density (veh/km/lane)
- **v** = Speed (km/h)

### Key Parameters

- **v_f** (Free-flow speed): Speed at zero density
- **k_j** (Jam density): Density at zero speed
- **q_max** (Capacity): Maximum achievable flow
- **k_m** (Critical density): Density at maximum flow

### Speed-Density Models

1. **Greenshields (1935)**: `v = v_f(1 - k/k_j)` - Linear relationship
2. **Greenberg (1959)**: `v = v_m·ln(k_j/k)` - Logarithmic relationship
3. **Underwood (1961)**: `v = v_f·exp(-k/k_m)` - Exponential relationship

## 📚 References

Greenshields, B. D. (1935). A study of traffic capacity. In *Highway Research Board Proceedings* (Vol. 1935, pp. 448–462). National Research Council.

Greenberg, H. (1959). An analysis of traffic flow. *Operations Research, 7*(1), 79–85. https://doi.org/10.1287/opre.7.1.79

Underwood, R. T. (1961). Speed, volume, and density relationships. In *Quality and Speed in Highway Transportation* (pp. 91–109). Yale University Bureau of Highway Traffic.

Transportation Research Board. (2010). *Highway Capacity Manual 2010*. National Academies Press. https://doi.org/10.17226/14915

May, A. D. (1990). *Traffic Flow Fundamentals*. Prentice Hall.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository (Or take a zip file from this repo and unzip the file) 

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

This link is for temporary online preview (and hopefully I come back to it later) 

https://bfb3511e-7d47-4a06-9acd-92ecfb584ea7.preview.qwenlm.io/ 

## 📖 How to Cite This Work

If you use this tool in your research or teaching, please cite it as follows:

### Plain Text (APA)

```
Kavee, K. (2026). Traffic Flow Theory Interactive Learning Tool. 
Retrieved from https://github.com/korawichkavee/Traffic_Flow_Theory_Web_App
```

### BibTeX

```bibtex
@misc{kavee2026traffic,
  author = {Kavee, Korawich},
  title = {Traffic Flow Theory Interactive Learning Tool},
  year = {2026},
  howpublished = {\url{https://github.com/korawichkavee/Traffic_Flow_Theory_Web_App}},
  note = {Interactive web application for learning traffic flow theory}
}
```

## 👤 Author

**Korawich Kavee**

- LinkedIn: [https://www.linkedin.com/in/korawich-kavee-b8214a11b/](https://www.linkedin.com/in/korawich-kavee-b8214a11b/)
- GitHub: [https://github.com/korawichkavee](https://github.com/korawichkavee)
- Repository: [https://github.com/korawichkavee/Traffic_Flow_Theory_Web_App](https://github.com/korawichkavee/Traffic_Flow_Theory_Web_App)

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🙏 Acknowledgments

This project is based on classical traffic flow theory research and the Highway Capacity Manual. Special thanks to the transportation engineering community for developing these foundational concepts.
