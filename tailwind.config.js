/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './store/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                red: '#ef4444',
                blue: '#3b82f6',
                green: '#22c55e',
                yellow: '#eab308',
                purple: '#a21caf',
                glass: 'rgba(255,255,255,0.08)',
                neon: '#00fff7',
            },
            boxShadow: {
                neon: '0 0 8px #00fff7, 0 0 16px #00fff7',
            },
            transitionProperty: {
                width: 'width',
                height: 'height',
            },
        },
    },
    plugins: [],
};
