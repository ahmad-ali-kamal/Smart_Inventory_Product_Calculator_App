/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');
/**
 * Shared JS — runs on every page.
 * Page-specific scripts go in each blade file using @push('scripts').
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar scroll effect ---
    // Adds glass-strong class when user scrolls past 20px.
    // Only applies on pages that have #site-navbar (app layout).
    const nav = document.getElementById('site-navbar');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('glass-strong', window.scrollY > 20);
        });
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

});