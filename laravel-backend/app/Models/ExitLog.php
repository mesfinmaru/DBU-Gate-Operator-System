<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ExitLog extends Model {
    protected $primaryKey = 'log_id';
    protected $fillable = ['timestamp','student_id','asset_id','operator_id','result','reason'];
    public function student() { return $this->belongsTo(Student::class, 'student_id', 'student_id'); }
    public function operator() { return $this->belongsTo(Operator::class, 'operator_id'); }
    public function asset() { return $this->belongsTo(Asset::class, 'asset_id'); }
}
