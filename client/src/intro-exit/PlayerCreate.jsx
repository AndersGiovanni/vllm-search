import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * PlayerCreate Component
 * Collects player identifier (Prolific ID)
 */
export function PlayerCreate({ onPlayerID, connecting }) {
    const [playerID, setPlayerID] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!playerID || playerID.trim() === "") {
            return;
        }

        onPlayerID(playerID);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Enter Prolific ID
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="playerID">Prolific ID</Label>
                            <Input
                                id="playerID"
                                name="playerID"
                                type="text"
                                autoComplete="off"
                                required
                                autoFocus
                                placeholder="Enter your Prolific ID here"
                                value={playerID}
                                onChange={(e) => setPlayerID(e.target.value)}
                                disabled={connecting}
                            />
                            <p className="text-sm text-gray-500">
                                Please enter your Prolific ID. This is required to approve your payment.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={connecting || !playerID.trim()}
                            className="w-full"
                        >
                            {connecting ? "Connecting..." : "Enter"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
