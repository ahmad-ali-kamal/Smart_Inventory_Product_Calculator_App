<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BatchVariant extends Model
{
    protected $fillable = [
        'batch_id',
        'variant_id',
        'total_qty',
        'batch_qty',
    ];

    protected $casts = [
        'variant_id' => 'integer',
        'total_qty'  => 'integer',
        'batch_qty'  => 'integer',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}
