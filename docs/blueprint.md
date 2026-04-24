# **App Name**: DarthBarber

## Core Features:

- Client Appointment Booking: A web form for clients to select a barber, choose an available date and time slot from a calendar, and submit a new appointment request.
- Secure Appointment Storage: Functionality to securely save new appointment details (clientId, clientName, barberId, dataHora, status: 'pendente') to a 'appointments' collection in Firestore.
- Barber Dashboard: A dedicated dashboard page for logged-in barbers to view a real-time list of their scheduled appointments for the current day.
- Real-time Schedule Updates: Utilizes Firestore's real-time capabilities (onSnapshot equivalent for web) to instantly update the barber's schedule as appointments are created or modified.
- User Authentication: Basic user authentication for both clients and barbers to access personalized sections and manage their respective appointments.
- AI-Powered Style Assistant Tool: An integrated conversational tool that helps clients articulate their desired haircut or style preferences, generating a concise summary for the barber.

## Style Guidelines:

- The primary color is a vibrant yet deep blue, #4D6BF5. It signifies professionalism and modern precision, standing out against the dark scheme.
- The background color is a very dark, slightly desaturated blue-black, #21212C. This establishes a sophisticated dark mode as requested by the user, providing a strong contrast for UI elements.
- The accent color is a bright, energetic sky blue, #8FDEFF. It is used for interactive elements like buttons, links, and highlights, drawing attention effectively within the dark palette.
- Headlines use 'Space Grotesk' (sans-serif) for a modern, slightly tech-inspired, and precise feel. Body text uses 'Inter' (sans-serif) for excellent readability across forms and lists.
- Clean, line-based modern icons (e.g., calendar, clock, scissors, user profile) should be used. Prioritize clarity and easy recognition against the dark background to enhance user experience.
- A responsive, card-based layout with generous spacing. Main content areas utilize clean sections for clear data presentation, ensuring usability across various screen sizes.
- Subtle and fluid animations should be implemented for state changes, form submissions, and data loading. Provide gentle visual feedback without being distracting.