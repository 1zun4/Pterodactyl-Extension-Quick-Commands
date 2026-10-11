import './styles.css';
import { definePterodactylExtension } from '@pterodactyl/sdk';
import ConsoleButtons from './components/ConsoleButtons';

export default definePterodactylExtension({
    setup({ screens, slots }) {
        screens.register('admin', () => import('./screens/AdminScreen'));
        slots.register('server.console.before', ConsoleButtons);
    },
});
