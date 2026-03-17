import React from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, PlayCircle } from "lucide-react";

/**
 * VideoGallery Component
 *
 * Displays a grid of video thumbnails that users can click to load in the main player.
 * Shows watched/unwatched status and provides visual feedback.
 *
 * Props:
 * - videos: Array of video objects with {id, title, url, thumbnail, duration, ...}
 * - watchedVideos: Array of video IDs that have been watched
 * - currentVideoId: ID of the currently selected video
 * - onVideoSelect: Callback when a video thumbnail is clicked
 */
export default function VideoGallery({
  videos = [],
  watchedVideos = [],
  currentVideoId = null,
  onVideoSelect
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isWatched = (videoId) => watchedVideos.includes(videoId);
  const isCurrent = (videoId) => videoId === currentVideoId;

  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-50">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Available Videos</h2>

      <div className="space-y-3">
        {videos.map((video) => (
          <Card
            key={video.id}
            onClick={() => onVideoSelect(video)}
            className={`
              cursor-pointer transition-all duration-200 overflow-hidden
              ${isCurrent(video.id) ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}
              ${isWatched(video.id) ? 'bg-green-50' : 'bg-white'}
            `}
          >
            <div className="relative">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-200">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                  <PlayCircle className="w-12 h-12 text-white opacity-70" />
                </div>

                {/* Duration badge */}
                <Badge
                  variant="secondary"
                  className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white"
                >
                  {formatDuration(video.duration)}
                </Badge>

                {/* Watched indicator */}
                {isWatched(video.id) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* Video info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {video.title}
                </h3>
                {isWatched(video.id) && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Watched
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p>No videos available</p>
        </div>
      )}
    </div>
  );
}
