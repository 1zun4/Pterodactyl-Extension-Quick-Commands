<?php

declare(strict_types=1);

namespace QuickCommands\Support;

use InvalidArgumentException;

/**
 * Commands may contain {name} placeholders that are asked for before sending.
 */
final class Template
{
    private const string PATTERN = '/\{([a-z][a-z0-9_]{0,31})\}/i';

    /**
     * @param  list<string>  $commands
     * @return list<string>
     */
    public static function placeholders(array $commands): array
    {
        preg_match_all(self::PATTERN, implode("\n", $commands), $matches);

        return array_values(array_unique($matches[1]));
    }

    /**
     * Values lose line breaks and control characters, so they cannot add commands of their own.
     *
     * @param  list<string>  $commands
     * @param  array<string, string>  $values
     * @return list<string>
     */
    public static function fill(array $commands, array $values): array
    {
        return array_map(static fn (string $command): string => (string) preg_replace_callback(self::PATTERN, static function (array $match) use ($values): string {
            $value = mb_trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $values[$match[1]] ?? ''));

            if ($value === '') {
                throw new InvalidArgumentException("Enter a value for {$match[1]}.");
            }

            return $value;
        }, $command), $commands);
    }
}
