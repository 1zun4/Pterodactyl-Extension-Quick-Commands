import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createExtensionTestHost } from '@pterodactyl/sdk/testing';
import * as api from '../api';
import AdminScreen from './AdminScreen';

vi.mock('../api', async (importOriginal) => ({ ...(await importOriginal<typeof import('../api')>()), getAdminButtons: vi.fn() }));

const button = (id: number, label: string, commands: string[], changes: Partial<api.QuickButton> = {}): api.QuickButton => ({
    id,
    label,
    color: 'green',
    commands,
    placeholders: [],
    confirm: false,
    sort: 0,
    eggs: null,
    global: true,
    ...changes,
});

let host: ReturnType<typeof createExtensionTestHost> | undefined;

afterEach(() => {
    cleanup();
    host?.dispose();
    host = undefined;
    vi.unstubAllGlobals();
});

function renderScreen(buttons: api.QuickButton[]) {
    vi.mocked(api.getAdminButtons).mockResolvedValue({ buttons, eggs: [{ id: 144, name: 'CanvasMC' }] });
    host = createExtensionTestHost({ extensionId: 'quick-commands', prefix: 'qcmd' });
    render(<AdminScreen />, { wrapper: host.Wrapper });
}

const buttons = [button(1, 'Save world', ['save-all']), button(2, 'Announce restart', ['say Restarting in 1 minute', 'save-all'], { color: 'orange', eggs: [144], confirm: true })];

test('says the buttons sit below the console input and lists them in a table', async () => {
    renderScreen(buttons);

    expect(await screen.findByText(/^Buttons below the console input of every server/)).toBeTruthy();
    const row = (await screen.findByRole('button', { name: 'Announce restart' })).closest('tr')!;
    expect(within(row).getByText('say Restarting in 1 minute · save-all')).toBeTruthy();
    expect(within(row).getByText('CanvasMC')).toBeTruthy();
    expect(within(row).getByText('Yes')).toBeTruthy();
});

test('shows a card per button on narrow screens', async () => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener: () => {}, removeEventListener: () => {} }));
    renderScreen(buttons);

    const card = (await screen.findByRole('button', { name: 'Announce restart' })).closest('li')!;
    expect(screen.queryByRole('table')).toBeNull();
    expect(within(card).getByText('say Restarting in 1 minute')).toBeTruthy();
    expect(within(card).getByText('save-all')).toBeTruthy();
    expect(within(card).getByText('Shown on')).toBeTruthy();
    expect(within(card).getByText('CanvasMC')).toBeTruthy();
    expect(within(card).getByText('Yes')).toBeTruthy();

    const first = screen.getByRole('button', { name: 'Save world' }).closest('li')!;
    expect(within(first).getByText('Every server')).toBeTruthy();
    expect(within(first).getByText('No')).toBeTruthy();

    fireEvent.click(within(card).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByDisplayValue('Announce restart')).toBeTruthy();
});

test('says when there are no buttons on narrow screens', async () => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener: () => {}, removeEventListener: () => {} }));
    renderScreen([]);

    expect(await screen.findByText('No buttons yet.')).toBeTruthy();
});
