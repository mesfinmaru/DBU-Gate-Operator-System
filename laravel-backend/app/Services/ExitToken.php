<?php
namespace App\Services;
class ExitToken {
    public static function issue(string $studentId, int $operatorId, bool $hasAssets): string {
        $ts = time();
        $nonce = bin2hex(random_bytes(8));
        $payload = "{$studentId}|{$operatorId}|".(int)$hasAssets."|{$nonce}|{$ts}";
        $sig = hash_hmac('sha256', $payload, env('EXIT_TOKEN_SECRET_KEY', env('QR_SECRET_KEY')));
        return rtrim(strtr(base64_encode("{$payload}|{$sig}"), '+/', '-_'), '=');
    }
    public static function verify(string $token, string $studentId, int $operatorId, ?bool $requireHasAssets = null): bool {
        try {
            $decoded = base64_decode(strtr($token, '-_', '+/'));
            $parts = explode('|', $decoded);
            if (count($parts) !== 6) return false;
            [$sid,$opid,$has,$nonce,$ts,$sig] = $parts;
            $payload = "{$sid}|{$opid}|{$has}|{$nonce}|{$ts}";
            $expSig = hash_hmac('sha256', $payload, env('EXIT_TOKEN_SECRET_KEY', env('QR_SECRET_KEY')));
            if (!hash_equals($expSig, $sig)) return false;
            if ((time() - (int)$ts) > (int)env('EXIT_TOKEN_TTL_SECONDS',300)) return false;
            if ((string)$sid !== (string)$studentId || (int)$opid !== (int)$operatorId) return false;
            if (!is_null($requireHasAssets) && (int)$has !== (int)$requireHasAssets) return false;
            return true;
        } catch (\Throwable $e) { return false; }
    }
}
