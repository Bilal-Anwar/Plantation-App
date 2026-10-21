import { removeLegacySamples } from './services/storage';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

removeLegacySamples();

createRoot(document.getElementById('root')!).render(<App />);
