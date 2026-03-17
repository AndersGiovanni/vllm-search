import React from "react";
import { PlayCircle } from "lucide-react";

/**
 * VideoGrid Component
 *
 * Displays videos in a responsive grid layout for user selection.
 * Click tracking is handled in the background for analysis.
 */
export default function VideoGrid({ videos, videoStats, onVideoClick }) {
  // Format duration from seconds to MM:SS
  const formatDuration = (duration) => {
    if (typeof duration === "string") {
      return duration; // Already formatted
    }
    if (!duration) return "0:00";
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Available Videos</h2>
        <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
          {videos.length}
        </span>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {videos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-xs">No videos available</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {videos.map((video) => {
              return (
                <div
                  key={video.id}
                  onClick={() => onVideoClick(video)}
                  className="group relative cursor-pointer rounded overflow-hidden border border-gray-200 hover:border-blue-400 bg-white transition-all duration-200 hover:shadow-md flex flex-col"
                >
                  {/* Thumbnail - Full Width */}
                  <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <PlayCircle className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-8 h-8 text-white" fill="white" fillOpacity="0.8" />
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* Video Info - Compact */}
                  <div className="p-2 flex flex-col gap-1 min-w-0">
                    <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 leading-tight">
                      {video.title || video.id || "Untitled Video"}
                    </h3>

                    {/* Metadata */}
                    {video.lengthCategory && (
                      <div className="mt-auto pt-1">
                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">
                          {video.lengthCategory}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
