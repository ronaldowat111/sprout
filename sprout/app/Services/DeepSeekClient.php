<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Minimal client for DeepSeek's OpenAI-compatible chat completions API.
 * The coach uses it when no Anthropic key is configured.
 */
class DeepSeekClient
{
    public static function configured(): bool
    {
        return filled(config('services.deepseek.key'));
    }

    /**
     * Sends one chat completion request and returns the first choice:
     * ['message' => [...], 'finish_reason' => string].
     *
     * @param  list<array<string, mixed>>  $messages  OpenAI-format messages, system first
     * @param  list<array<string, mixed>>  $tools  OpenAI-format tool definitions
     * @return array{message: array<string, mixed>, finish_reason: string}
     */
    public function chat(array $messages, array $tools = [], bool $json = false): array
    {
        $body = [
            'model' => config('services.deepseek.model'),
            'messages' => $messages,
            'max_tokens' => 2000,
        ];
        if ($tools !== []) {
            $body['tools'] = $tools;
        }
        if ($json) {
            $body['response_format'] = ['type' => 'json_object'];
        }

        $choice = Http::withToken(config('services.deepseek.key'))
            ->baseUrl(rtrim(config('services.deepseek.base_url'), '/'))
            ->acceptJson()
            ->timeout(60)
            ->post('/chat/completions', $body)
            ->throw()
            ->json('choices.0');

        return [
            'message' => $choice['message'] ?? [],
            'finish_reason' => $choice['finish_reason'] ?? 'stop',
        ];
    }

    /**
     * Converts CoachTools::definitions() (Anthropic shape) to OpenAI function tools.
     *
     * @param  list<array{name: string, description: string, inputSchema: array<string, mixed>}>  $definitions
     * @return list<array<string, mixed>>
     */
    public static function tools(array $definitions): array
    {
        return array_map(fn (array $d) => [
            'type' => 'function',
            'function' => [
                'name' => $d['name'],
                'description' => $d['description'],
                'parameters' => $d['inputSchema'],
            ],
        ], $definitions);
    }
}
