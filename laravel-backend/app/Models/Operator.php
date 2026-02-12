<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Operator extends Model {
    protected $fillable = ['username','password_hash','role'];
    protected $hidden = ['password_hash'];
    public function exits() { return $this->hasMany(ExitLog::class, 'operator_id'); }
}
