import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createExtensionTestHost, createTestServer } from '@pterodactyl/sdk/testing';
import * as api from '../api';
import ConsoleButtons from './ConsoleButtons';

vi.mock('../api', async (importOriginal) => ({ ...(await importOriginal<typeof import('../api')>()), getButtons: vi.fn(), runButton: vi.fn().mockResolvedValue({ sent: 1 }) }));

const button = (id: number, label: string, commands: string[], placeholders: string[] = [], global = true): api.QuickButton => ({ id, label, color: 'grey', commands, placeholders, confirm: false, sort: 0, eggs: null, global });

afterEach(cleanup);

test('sends plain buttons at once and asks for placeholder values first', async () => {
    vi.mocked(api.getButtons).mockResolvedValue({ buttons: [button(1, 'Save', ['save-all']), button(2, 'Kick', ['kick {player}'], ['player'])], can_manage: false });
    const server = createTestServer({ owner: false, permissions: ['control.console'] });
    const host = createExtensionTestHost({ extensionId: 'quick-commands', prefix: 'qcmd', server });
    render(<ConsoleButtons data={server} />, { wrapper: host.Wrapper });

    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.runButton).toHaveBeenCalledWith(server.attributes.identifier, 1, {}));

    fireEvent.click(screen.getByRole('button', { name: 'Kick' }));
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('player'), { target: { value: 'Steve' } });
    expect(screen.getByText('kick Steve')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    host.dispose();
});

test('moves the row directly below the console input', async () => {
    vi.mocked(api.getButtons).mockResolvedValue({ buttons: [button(1, 'Save', ['save-all'])], can_manage: false });
    const console = document.createElement('div');
    console.innerHTML = '<div id="input-row"><input aria-label="Console command input." /></div><div id="after"></div>';
    document.body.append(console);
    const server = createTestServer({ owner: false, permissions: ['control.console'] });
    const host = createExtensionTestHost({ extensionId: 'quick-commands', prefix: 'qcmd', server });
    render(<ConsoleButtons data={server} />, { wrapper: host.Wrapper });

    const save = await screen.findByRole('button', { name: 'Save' });
    expect(document.getElementById('input-row')!.nextElementSibling!.contains(save)).toBe(true);
    console.remove();
    host.dispose();
});
