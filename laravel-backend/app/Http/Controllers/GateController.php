<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Asset;
use App\Models\ExitLog;
use App\Services\ExitToken;
use App\Services\QrService;
class GateController extends Controller {
    public function scanStudent(Request $req) {
        $studentId = trim((string)$req->input('student_id',''));
        if (!$studentId) return response()->json(['status'=>'BLOCKED','reason'=>'Student ID required'],400);
        $student = Student::find($studentId);
        $op = $req->user();
        if (!$student) { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Student not found']); return response()->json(['status'=>'BLOCKED','reason'=>'Student not found'],404); }
        if ($student->status !== 'active') { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>"Student inactive: {$student->status}"]); return response()->json(['status'=>'BLOCKED','reason'=>'Student inactive'],403); }
        $hasAssets = Asset::where('owner_student_id',$studentId)->where('status','active')->exists();
        return response()->json([
            'status'=>'OK','student'=>$student,
            'has_assets'=>$hasAssets,
            'asset_count'=>Asset::where('owner_student_id',$studentId)->where('status','active')->count(),
            'exit_token'=>ExitToken::issue($studentId, $op->id, $hasAssets)
        ],200);
    }
    public function scanAsset(Request $req) {
        $studentId = trim((string)$req->input('student_id',''));
        $qrData = (string)$req->input('qr_data','');
        $exitToken = (string)$req->input('exit_token','');
        $op = $req->user();
        if (!$studentId || !$qrData || !$exitToken) return response()->json(['status'=>'BLOCKED','reason'=>'Student ID, QR data, and exit token required'],400);
        if (!ExitToken::verify($exitToken, $studentId, $op->id, true)) { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Invalid or expired exit token']); return response()->json(['status'=>'BLOCKED','reason'=>'Invalid or expired exit token'],403); }
        $student = Student::find($studentId);
        if (!$student || $student->status !== 'active') { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Student invalid or inactive']); return response()->json(['status'=>'BLOCKED','reason'=>'Student invalid or inactive'],403); }
        $asset = QrService::verify($qrData);
        if (!$asset) { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Invalid QR']); return response()->json(['status'=>'BLOCKED','reason'=>'Invalid QR'],403); }
        if ((string)$asset->owner_student_id !== (string)$studentId) { ExitLog::create(['student_id'=>$studentId,'asset_id'=>$asset->asset_id,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Ownership mismatch']); return response()->json(['status'=>'BLOCKED','reason'=>'Ownership mismatch'],403); }
        if ($asset->status !== 'active') { ExitLog::create(['student_id'=>$studentId,'asset_id'=>$asset->asset_id,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>"Asset {$asset->status}"]); return response()->json(['status'=>'BLOCKED','reason'=>"Asset {$asset->status}"],403); }
        ExitLog::create(['student_id'=>$studentId,'asset_id'=>$asset->asset_id,'operator_id'=>$op->id,'result'=>'ALLOWED','reason'=>'Exit verified successfully']);
        return response()->json(['status'=>'ALLOWED','reason'=>'Exit verified successfully','student'=>$student,'asset'=>$asset],200);
    }
    public function exitWithoutAsset(Request $req) {
        $studentId = trim((string)$req->input('student_id',''));
        $exitToken = (string)$req->input('exit_token','');
        $op = $req->user();
        if (!$studentId || !$exitToken) return response()->json(['status'=>'BLOCKED','reason'=>'Student ID and exit token required'],400);
        if (!ExitToken::verify($exitToken, $studentId, $op->id, false)) { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Invalid or expired exit token']); return response()->json(['status'=>'BLOCKED','reason'=>'Invalid or expired exit token'],403); }
        $student = Student::find($studentId);
        if (!$student || $student->status !== 'active') { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Student invalid or inactive']); return response()->json(['status'=>'BLOCKED','reason'=>'Student invalid or inactive'],403); }
        if (Asset::where('owner_student_id',$studentId)->where('status','active')->exists()) { ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'BLOCKED','reason'=>'Registered assets present']); return response()->json(['status'=>'BLOCKED','reason'=>'Registered assets present'],403); }
        ExitLog::create(['student_id'=>$studentId,'operator_id'=>$op->id,'result'=>'ALLOWED','reason'=>'Exit without registered assets']);
        return response()->json(['status'=>'ALLOWED','reason'=>'Exit without assets verified','student'=>$student],200);
    }
    public function logs(Request $req) {
        $limit = (int)$req->input('limit', 50);
        $logs = ExitLog::orderByDesc('timestamp')->limit($limit)->get();
        return response()->json(['logs'=>$logs],200);
    }
}
