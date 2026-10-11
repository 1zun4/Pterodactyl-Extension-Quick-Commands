<?php

declare(strict_types=1);

namespace QuickCommands;

use Pterodactyl\Extensions\ExtensionProvider;

class QuickCommandsProvider extends ExtensionProvider
{
    public function boot(): void
    {
        $this->registerApiRoutes();
        $this->loadExtensionMigrations();

        $this->registerPermissions('Quick Commands.', [
            'manage' => 'Add, edit and delete the server\'s own buttons. Using buttons needs the console permission.',
        ]);
    }
}
