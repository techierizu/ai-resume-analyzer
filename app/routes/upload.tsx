
import { prepareInstructions } from "../../constants";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { generateUUID } from "~/lib/fileUtils";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";


const Upload = () => {
    const {fs, auth, isLoading, ai, kv} = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyze = async ({companyName, jobTitle, jobDescription, file } : {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        setIsProcessing(true);
        setStatusText("Uploading the file...");
        const uploadedFile = await fs.upload([file])

        if(!uploadedFile) return setStatusText("Error: Failed to upload file. Please try again.");
        setStatusText("Converting to image...")
        const imageFile = await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText("Error: Failed to convert PDF to image. Please try again.");
        setStatusText("Uploading the image...");
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText("Error: Failed to upload image. Please try again.");
        setStatusText("Preparing data...");

        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback: '',
        }
       await kv.set(`resume:${uuid}`, JSON.stringify(data));
         setStatusText("Analyzing resume...");

         const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({jobTitle, jobDescription, AIResponseFormat: 'json'})
         )
         if(!feedback) return setStatusText("Error: Failed to analyze resume. Please try again.");

         const feedbackText = typeof feedback.message.content === 'string' ?
          feedback.message.content : 
         feedback.message.content[0].text;

         data.feedback = JSON.parse(feedbackText);
         await kv.set(`resume:${uuid}`, JSON.stringify(data));
         setStatusText("Analysis complete! Redirecting to home page...");

    }
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form || !file) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name");
    const jobTitle = formData.get("job-title");
    const jobDescription = formData.get("job-description");
    if(!file) return
    handleAnalyze({companyName: companyName as string, jobTitle: jobTitle as string, jobDescription: jobDescription as string, file });
    }
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover ">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
            <h1>Smart Feedback for your dream job</h1>
            {isProcessing ? (
                <>
                <h2>{statusText}</h2>
                <img src="/images/resume-scan.gif"className="w-full" alt="gif" />
                </>
            ) : (
                <h2>Drop your resume for an ATS score and improvement tips</h2>
            )
                }
        </div>
        {!isProcessing ? (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                <div className="form-div">
                    <label htmlFor="company-name">
                        Company Name
                    </label>
                    <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                </div>
                <div className="form-div">
                    <label htmlFor="job-title">
                        Job Title
                    </label>
                    <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                </div>
                <div className="form-div">
                    <label htmlFor="job-description">
                        Job Description
                    </label>
                    <textarea name="job-description" placeholder="Job Description" id="job-description" />
                </div>
                <div className="form-div">
                    <label htmlFor="uploader">
                        Upload Resume
                    </label>
                    <FileUploader onFileSelect={handleFileSelect}/>
                </div>
                <button className="primary-button" type="submit">Analyze Resume</button>
            </form>
        ): (
            <div></div>
        )}
      </section>
    </main>
  )
};
export default Upload;