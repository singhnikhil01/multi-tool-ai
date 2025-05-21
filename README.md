# multi-tool-ai

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)

This project is an AI multi-tool designed to streamline various tasks. It provides capabilities for interactive chat, image generation and enhancement, text summarization, and goal planning, aiming to be a versatile assistant for different needs.

## Table of Contents

*   [Features](#features)
*   [Technologies Used](#technologies-used)
*   [Installation](#installation)
*   [Usage](#usage)
*   [Contributing](#contributing)
*   [License](#license)
*   [Acknowledgements](#acknowledgements)

## Features

*   **AI Chat**: Engage in conversational interactions with the AI.
*   **Image Generation & Improvement**: Create new images or enhance existing ones.
*   **Text Summarization**: Quickly get concise summaries of longer texts.
*   **Goal Planning**: Utilize the AI to help structure and plan your objectives.

## Technologies Used

*   TypeScript
*   Node.js
*   @google/genai (Likely for AI model interaction)
*   React
*   React DOM
*   Tailwind CSS (@tailwindcss/typography)
*   Lucide React (Icon library)
*   Marked & React Markdown (For handling Markdown content, possibly from AI responses)
*   DOMPurify (For sanitizing HTML/Markdown output)
*   And more...

## Installation

To set up the project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/multi-tool-ai.git
    ```
    *(Replace `your-username` with the actual GitHub username/organization)*
2.  **Navigate to the project directory:**
    ```bash
    cd multi-tool-ai
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Set up API Key:**
    Create a `.env.local` file in the root directory and set your Gemini API key:
    ```dotenv
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    *(Obtain your Gemini API key from [Google AI Studio](https://aistudio.google.com/)*)

## Usage

Once installed and configured, you can run the application using the available scripts:

*   **Run in development mode:**
    ```bash
    npm run dev
    ```
    This will typically start a local server with hot-reloading.
*   **Build for production:**
    ```bash
    npm run build
    ```
    This compiles the project for production deployment.
*   **Preview the production build:**
    ```bash
    npm run preview
    ```
    This serves the built application locally to test the production version.

## Contributing

Contributions are welcome! Please feel free to open an issue to discuss a new feature or bug, or submit a pull request.
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file for more details.

## Acknowledgements

*   Mention any libraries, tools, or individuals that deserve credit here.
*   Thanks to the open-source community.
