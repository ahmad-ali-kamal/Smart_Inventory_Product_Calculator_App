<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductCalculator;

class CalculatorProductController extends Controller
{
    public function activate(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer'
        ]);

        $pc = ProductCalculator::updateOrCreate(
            ['product_id' => $request->product_id],
            ['is_enabled' => true]
        );

        return response()->json([
            'message' => 'Calculator activated for product',
            'data' => $pc
        ]);
    }

    public function deactivate(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer'
        ]);

        $pc = ProductCalculator::where('product_id', $request->product_id)->first();

        if ($pc) {
            $pc->update(['is_enabled' => false]);
        }

        return response()->json([
            'message' => 'Calculator deactivated for product'
        ]);
    }

    public function bulkActivate(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array'
        ]);

        foreach ($request->product_ids as $id) {
            ProductCalculator::updateOrCreate(
                ['product_id' => $id],
                ['is_enabled' => true]
            );
        }

        return response()->json([
            'message' => 'Calculator activated for selected products'
        ]);
    }
}
