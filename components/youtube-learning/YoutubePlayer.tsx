import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import YoutubePlayerLib, { YoutubeIframeRef } from "react-native-youtube-iframe";

interface YoutubePlayerProps {
  videoId: string;
  onChangeState?: (state: string) => void;
  onProgress?: (event: { currentTime: number; duration: number }) => void;
}

export interface YoutubePlayerRef {
  seekTo: (seconds: number) => void;
}

const YoutubePlayer = forwardRef<YoutubePlayerRef, YoutubePlayerProps>(({ videoId, onChangeState, onProgress }, ref) => {
  const playerRef = React.useRef<YoutubeIframeRef>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      playerRef.current?.seekTo(seconds, true);
      setPlaying(true);
    }
  }));

  const onStateChange = useCallback((state: string) => {
      if (state === "ended") {
        setPlaying(false);
      }
      if (state === "playing") {
        setPlaying(true);
      }
      if (state === "paused") {
        setPlaying(false);
      }
      onChangeState?.(state);
  }, [onChangeState]);

  const onReady = useCallback(() => {
    setReady(true);
  }, []);

  return (
    <View style={styles.container}>
      <YoutubePlayerLib
        ref={playerRef}
        height={220}
        play={playing}
        videoId={videoId}
        onChangeState={onStateChange}
        onReady={onReady}
        // Force modest branding and other controls
        initialPlayerParams={{
            modestbranding: true,
            controls: true,
            fs: true,
        }}
        webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            androidLayerType: 'hardware'
        }}
      />
      
      {/* Poll for progress since the library doesn't have a direct onProgress prop in the main component types sometimes, 
          but actually checking docs: it DOES NOT have onProgress in v2. 
          Wait, looking at docs for react-native-youtube-iframe...
          It usually requires using a ref to getCurrentTime() periodically or we can use the specific prop if available?
          
          Actually, let's look at the type definition or docs if I could.
          Common pattern is using an interval or just relying on `onChangeState`?
          
          BUT: user prompt says:
          const onProgress = (e) => { setCurrentTime(e); };
          
          Wait, the user prompt implies there is an output.
          Let's check if we can get progress.
          The library typically doesn't emit progress automatically every second.
          We might need to set up an interval in the parent or here.
          
          Let's implement a simple interval here when playing.
       */}
       <ProgressTracker 
          playing={playing} 
          playerRef={playerRef} 
          onProgress={onProgress} 
       />
    </View>
  );
});

// Helper component to track progress to avoid re-rendering the whole player
function ProgressTracker({ playing, playerRef, onProgress }: { playing: boolean, playerRef: any, onProgress?: (e: any) => void }) {
    React.useEffect(() => {
        if (!playing || !onProgress) return;
        const interval = setInterval(async () => {
             const time = await playerRef.current?.getCurrentTime();
             const duration = await playerRef.current?.getDuration();
             if (time !== undefined && duration !== undefined) {
                 onProgress({ currentTime: time, duration });
             }
        }, 500);
        return () => clearInterval(interval);
    }, [playing, onProgress, playerRef]);
    return null;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#000",
    height: 220, // Height is controlled by the player prop
    justifyContent: 'center',
  },
});

export default YoutubePlayer;
