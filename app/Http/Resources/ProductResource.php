<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'salla_id'    => $this->salla_product_id,
            'name'        => $this->name,
            'sku'         => $this->sku,
            'description' => $this->metadata['description'] ?? null,
            'price'       => $this->price,
            'quantity'    => $this->quantity,
            'category'    => $this->category,
            'status'      => $this->status,
            'image'       => $this->mainImage?->image_url,
            'images'      => $this->whenLoaded('images', fn() =>
                $this->images->map(fn($img) => [
                    'url'     => $img->image_url,
                    'is_main' => $img->is_main,
                ])
            ),
            'synced_at'   => $this->synced_at?->format('Y-m-d H:i:s'),
            'created_at'  => $this->created_at->format('Y-m-d'),
        ];
    }
}