<?php
namespace App\Services;
use App\Models\Asset;
class QrService {
    public static function generate(Asset $asset): string {
        $ts = time();
        $nonce = bin2hex(random_bytes(8));
        $payload = "{$asset->asset_id}|{$asset->owner_student_id}|{$asset->serial_number}|{$nonce}|{$ts}";
        $sig = hash_hmac('sha256', $payload, env('QR_SECRET_KEY', 'change-me'));
        return rtrim(strtr(base64_encode("{$payload}|{$sig}"), '+/', '-_'), '=');
    }
    public static function verify(string $qr): ?Asset {
        try {
            $decoded = base64_decode(strtr($qr, '-_', '+/'));
            $parts = explode('|', $decoded);
            if (count($parts) !== 6) return null;
            [$asset_id,$student_id,$serial,$nonce,$ts,$sig] = $parts;
            $payload = "{$asset_id}|{$student_id}|{$serial}|{$nonce}|{$ts}";
            $expSig = hash_hmac('sha256', $payload, env('QR_SECRET_KEY', 'change-me'));
            if (!hash_equals($expSig, $sig)) return null;
            if ((time() - (int)$ts) > (int)env('QR_VALIDITY_HOURS',24)*3600) return null;
            $asset = Asset::find((int)$asset_id);
            if (!$asset || $asset->serial_number !== $serial || (string)$asset->owner_student_id !== (string)$student_id) return null;
            return $asset;
        } catch (\Throwable $e) { return null; }
    }
}
