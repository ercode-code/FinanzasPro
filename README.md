# FinanzasPro 💸🧠

**FinanzasPro** es una aplicación web innovadora diseñada para revolucionar la manera en que gestionas tus finanzas personales. A través de un simulador financiero interactivo y recomendaciones impulsadas por Inteligencia Artificial (IA), FinanzasPro te ayuda a tomar decisiones inteligentes para ahorrar y optimizar tus recursos.

![FinanzasPro Mockup](images/mockup-hero.png) <!-- Asegúrate de tener una imagen representativa o elimina esta línea -->

## 🌟 Características Principales

* **Dashboard Financiero Completo**: Visualiza tus ingresos, gastos fijos y variables con gráficos intuitivos y resúmenes automáticos.
* **Asesoría Financiera con IA**: Integración con modelos de Inteligencia Artificial (ej. Gemini) para brindar consejos personalizados basados en tus hábitos de gasto y metas de ahorro.
* **Simulador de Ahorro y Crédito**: Evalúa escenarios financieros antes de tomar decisiones importantes.
* **Soporte y Donaciones**: Sistema integrado de apoyo al proyecto mediante PayPal con una interfaz segura y moderna, y simulación de pagos con tarjeta de crédito (Stripe Demo).
* **Modo Oscuro / Claro**: Diseño adaptable (Dark Mode) y completamente responsive para dispositivos móviles.

## 🛠️ Tecnologías Utilizadas

* **Frontend**: HTML5, CSS3 (Variables, Flexbox, Grid), JavaScript (ES6+).
* **Base de Datos & Autenticación**: Firebase (Auth, Firestore).
* **IA**: Integración de API de Google Gemini para recomendaciones.
* **Librerías Adicionales**: 
  * [Chart.js](https://www.chartjs.org/) para visualización de datos.
  * [FontAwesome](https://fontawesome.com/) para íconos.
  * [Google Fonts (Inter)](https://fonts.google.com/) para tipografía moderna.

## 🚀 Instalación y Despliegue Local

1. **Clonar el Repositorio**
   ```bash
   git clone https://github.com/tu-usuario/FinanzasPro.git
   cd FinanzasPro
   ```

2. **Configuración de Firebase**
   Asegúrate de actualizar la configuración de inicialización de Firebase en `js/app.js` (u otro archivo correspondiente) con tus credenciales si deseas conectar tu propia base de datos.

3. **Ejecución Local**
   Al ser un proyecto nativo con HTML/CSS/JS, puedes utilizar herramientas como **Live Server** de VS Code o Python para iniciar un servidor local:
   ```bash
   # Utilizando Python 3
   python -m http.server 8000
   ```
   Luego, abre `http://localhost:8000` en tu navegador.

## 📦 Estructura del Proyecto

```text
FinanzasPro/
├── css/             # Hojas de estilo generales e index.css
├── js/              # Lógica de componentes y configuración
├── images/          # Assets de imágenes e íconos
├── index.html       # Landing page (Página principal)
├── finanzas.html    # Aplicación principal y Dashboard
├── donar.html       # Pasarela de apoyo/donaciones
└── README.md        # Documentación del proyecto
```

## 🤝 Contribuciones y Apoyo
El código fuente de FinanzasPro es independiente y las contribuciones son bienvenidas. Si deseas apoyar el proyecto para mantener la infraestructura y consumo de APIs, puedes hacerlo a través de la página de [Apoyo a FinanzasPro](donar.html) de manera voluntaria.

---

**FinanzasPro** - *Domina tu dinero de forma inteligente.*
