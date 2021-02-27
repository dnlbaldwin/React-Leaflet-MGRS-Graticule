import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Browsers on phones generally have a toolbar at the bottom of their viewport
// and sometimes it doesn't get taken into account when determining the viewheight.
// The following code will listen for a resize event to handle portrait/landscape
// mode changes and set the viewheight appropriately.
window.addEventListener('resize', () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
