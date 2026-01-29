import { useCallback, useRef } from 'react';

// Base64 encoded page turn sound (short, subtle paper sound)
const PAGE_TURN_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+9DEAAAIAAaX9AAAIvhC0z89kAAAAGhJJN0AAABo0aRo0X4fn/y5cuL8P5c5/Lly5fh/P/+XP5cv/y58ufLnP/l/w/D+fO7uFw/+X/6urjjjju7v/Lly7u7u////+7u7u8QhD//8IQhCEITu7u/+EPu7u7hCd3d3//u7u7u7u4Qnd3d3d3d///d3d3d3CEIQhO7u7u7v/CEITu7u7//+EIQhCEIQ+7v/u7u7uEJ3d////8IQhCEIQhCd3d3f/+7u7u7hCEIQn//8IQnd3d3d//+EPu7u7u7v/hD7u7u7u4QhO7u7v/+7u7u7u7u7hD7u7v/+EP/+EJ3d3d3d3d///d3d3d3d3d3/+7u7u7u7u7u7hCd3d3d//+EPu7u7u7/+EPu7u7u7u7u7u7/8IfhD/u7u7u7u//hD7u7v/+7u7u7u7uEPu7u7/+EIQhO7u7u/+7u7u7u7u4QhCE7u7u7v/+EIQhCEJ3d3d//+7u7u7u7u7hCEP/+7u7u7u7u7u7hD7u7v/+7v/u7u7u7u7hD7u7u7//d3d3d3d3d3d3d3d3d3d//u7u7u7u7uEIQhO7u7u7/+7u7u7u7v/hCE7u7u7//u7u7u7u7u4Q+7u7v/8IQhCd3d3f/+EPu7u7u7hCEIQhO7u7u7v/8IQhCEIQnd3d///u7u7u7u4QhCE//+7u7u7u7u7u7hD/u7u//+7u/+7u7u7u7hD7u7u7//d3d3d3d3d3d3d3d3d3d//u7u7u7u7uEIQhO7u7u7/+7u7u7u7v/hCE7u7u7//u7u7u7u7u4Q+7u7v/8IQhCd3d3f/+EPu7u7u7hCEITu7u7u7v/8IQhCEIQnd3d///u7u7u7u4QhCE7u7u7u7//hCEIQhO7u7v//u7u7u7u7hCEIQ//+EIQhCd3d3d//+EIQhCEIQnd3d3//+7u7u7u7hCEIQ//+EJ3d3d3d3d3f/+7u7u7u7u7u7u7v/hD7u7v/+7u/+7u7u7u7hD7u7u7//d3d3d3d3d3f/+7u7u7u7u7v/hCEIQhO7u7u7/+7u7u7u7v/hD7u7u7//u7u7u7u7u4Q+7u7v/+EIQhCd3d3d/+EP/+7u7u4QhCEITu7u7u7v/8IQhCEIQnd3d//+7u7u7u7hCEIQ//+EJ3d3d3d///+7u7u7u7u7u7u7v/hD7u7u/+7u/+7u7u7u7hD//tQxBEAAADSAAAAAAAAANIAAAAAu7u7//d3d3d3d3d3f/u7u7u7u7u7u/+EIQhCE7u7u7/+7u7u7u7u/+EPu7u7u//u7u7u7u7uEPu7u7//hCEIQnd3d3f/hD//u7u7u7hCEITu7u7u7u//hCEIQhCd3d3//+7u7u7u7hCEIT//+EJ3d3d3d3///+7u7u7u7u7u7u7v/hD7u7u//u7//u7u7u7u4Q+7u7u7//d3d3d3d3d3d/+7u7u7u7u7u7/4QhCEITu7u7u//u7u7u7u7/4Q+7u7u7//u7u7u7u7u4Q+7u7//8IQhCE7u7u7/+EP/+7u7u7hCEIQhO7u7u7v/8IQhCEIQnd3d//+7u7u7u7hCEIT//+EJ3d3d3d3d//+7u7u7u7u7u7u7/+EPu7u7/+7v/+7u7u7u4Q+7u7u7//d3d3d3d3d3d/+7u7u7u7u7u/+EIQhCE7u7u7/+7u7u7u7u/+EPu7u7u//u7u7u7u7uEPu7u7//hCEIQnd3d3f/hD/u7u7u7hCEIQhO7u7u7v/8IQhCEIQnd3d//+7u7u7u7hCEIT//+EJ3d3d3d3d//+7u7u7u7u7u7u7/+EPu7u7/+7v/+7u7u7u4Q+7u7u7//d3d3d3d3d3d/+7u7u7u7u7u/+EIQhCE7u7u7/+7u7u7u7u/+EPu7u7u//u7u7u7u7uEPu7u7//hCEIQnd3d3f/hD/u7u7u7hCEIQhO7u7u7v/8IQhCEIQnd3d//+7u7u7u7hCEIT//+EJ3d3d3d3d//+7u7u7u7u7u7u7/+EPu7u7';

export function usePageSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);

  const playPageTurn = useCallback(() => {
    if (isMutedRef.current) return;

    try {
      // Create new audio instance for overlapping sounds
      const audio = new Audio(PAGE_TURN_SOUND);
      audio.volume = 0.3;
      audio.playbackRate = 1.2; // Slightly faster for snappier feel
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    } catch (e) {
      // Silently fail
    }
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    return !isMutedRef.current;
  }, []);

  const isMuted = useCallback(() => isMutedRef.current, []);

  return { playPageTurn, toggleMute, isMuted };
}
