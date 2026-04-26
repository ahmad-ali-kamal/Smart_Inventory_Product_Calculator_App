/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                purple: {
                    deep: '#523859',
                    light: '#6B4D78',
                    dark: '#3A2640',
                },
                orchid: {
                    DEFAULT: '#E8BCCD',
                    light: '#F2D4E2',
                    dark: '#D4A0B8',
                },
            },
            fontFamily: {
                display: ['Cormorant Garamond', 'serif'],
                body: ['DM Sans', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
};