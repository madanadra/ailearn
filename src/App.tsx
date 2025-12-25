import { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

type Prediction = {
    exist: boolean
    yes: string
    no: string
} | undefined

export default function App() {
    const videoRef = useRef<HTMLVideoElement | null>(null)
      const modelRef = useRef<tmImage.CustomMobileNet | null>(null)
      const rafId = useRef<number | null>(null)
    
      const [prediction, setPrediction] = useState<Prediction>()
      const [error, setError] = useState<boolean>(false)
      const [loading, setLoading] = useState<boolean>(true)
    
      const MODEL_URL = "/model/"
    
      useEffect(() => {
        const init = async () => {
          try {
            const model = await tmImage.load(
              MODEL_URL + "model.json",
              MODEL_URL + "metadata.json"
            );
            modelRef.current = model
    
            const video = videoRef.current!
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            })
    
            video.srcObject = stream
            await video.play()
            setLoading(false)
            loop()
          } catch (err) {err && setError(true)}
        }
    
        const loop = async () => {
            if (!modelRef.current || !videoRef.current) return
        
            rafId.current = requestAnimationFrame(loop)
        
            const res = await modelRef.current.predict(videoRef.current)
            const exist = res.find(obj => obj.className === 'exist')
            const empty = res.find(obj => obj.className === 'empty')

            if (exist && empty) {
                const arr = {
                    yes: (exist.probability*100).toFixed(2)+'%',
                    no: (empty.probability*100).toFixed(2)+'%'
                }
                const final = exist.probability >= empty.probability ? {...arr, exist: true} : {...arr, exist: false}
                setPrediction(final)
                setError(false)
            }
        }
    
        init()
    
        return () => {
          if (rafId.current) cancelAnimationFrame(rafId.current)
          if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
            tracks.forEach((t) => t.stop())
          }
        }
    }, [])

    return (
        <div className="font-main text-neutral-50 uppercase grid content-center justify-center bg-orange-600 min-h-dvh">
            <div className="grid sm:grid-cols-2 gap-8 p-4">
                <div className="grid bg-orange-400 aspect-square max-w-3xs rounded-3xl mx-auto">
                    <video ref={videoRef} className="w-full h-full" autoPlay playsInline />
                </div>
                <div className="grid gap-y-6 content-center">
                    <h1 className="text-3xl">Is there anyone?</h1>
                    {error ? <h1>An error occurred.</h1> : 
                    loading ? <h1>Please wait...</h1> :
                    <>
                      <div className="gap-y-4">
                          <div className={`${prediction?.exist ? '' : 'opacity-30'} flex items-center gap-x-4`}>
                              <h1 className="text-xl">Yes</h1>
                              <h1>{prediction?.yes}</h1>
                          </div>
                          <div className={`${prediction?.exist ? 'opacity-30' : ''} flex items-center gap-x-4`}>
                              <h1 className="text-xl">No</h1>
                              <h1>{prediction?.no}</h1>
                          </div>
                      </div>
                    </>}
                </div>
            </div>
        </div>
    )
}