import ScoreBadge from "./ScoreBadge";
import ScoreGauge from "./ScoreGauge";

const Catagory =({title, score}: {title: string, score: number})=>{

    const textColor = score > 70 ? 'text-graan-600'
    : score > 49 ? 'text-yellow-600'
    : 'text-red-600';

    return(
        <div className="resume-summary">
            <div className="catagory">
                <div className="flex flex-row gap-2 items-center justify-center">
                    <p className="text-2xl">{title}</p>
                    <ScoreBadge score={score}/>
                </div>
                <p className="text-2xl">
                    <span className={textColor}></span>/100
                </p>
            </div>
        </div>
    )
}

const Summary= ({feedback}: {feedback: Feedback})=>{
    return (
        <div className="bg-white rounded-2xl shadow-md w-full">
            <div className="flex flex-row items-center p-4 gap-8">
                <ScoreGauge score={feedback.overallScore}/>
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Your Resume Score</h2>
                    <p className="text-sm text-gray-500">
                        This Score is calculated based on the variables listed below.
                    </p>
                </div>
            </div>
            <Catagory title="Tone & Style" score={feedback.toneAndStyle?.score ?? 0}/>
            <Catagory title="Content" score={feedback.content?.score ?? 0}/>
            <Catagory title="Structure" score={feedback.structure?.score ?? 0}/>
            <Catagory title="Skills" score={feedback.skills?.score ?? 0}/>
        </div>
    )
}
export default Summary;