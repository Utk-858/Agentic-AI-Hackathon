'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

const quotes = [
    {
      en: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      hi: "ऐसे जियो जैसे कि तुम कल मरने वाले हो। ऐसे सीखो जैसे कि तुम हमेशा के लिए जीने वाले हो।",
      mr: "असे जगा जणू तुम्ही उद्या मरणार आहात. असे शिका की जणू तुम्ही कायमचे जगणार आहात.",
    },
    {
      en: "The beautiful thing about learning is that no one can take it away from you.",
      hi: "सीखने की सबसे खूबसूरत बात यह है कि कोई भी इसे आपसे छीन नहीं सकता।",
      mr: "शिकण्याची सर्वात सुंदर गोष्ट म्हणजे ती तुमच्याकडून कोणीही काढून घेऊ शकत नाही.",
    },
    {
      en: "The mind is not a vessel to be filled, but a fire to be kindled.",
      hi: "मन भरने का पात्र नहीं, बल्कि जलाने की आग है।",
      mr: "मन भरण्याचे भांडे नाही, तर पेटवण्याची आग आहे.",
    },
    {
      en: "An investment in knowledge pays the best interest.",
      hi: "ज्ञान में किया गया निवेश सबसे अच्छा ब्याज देता है।",
      mr: "ज्ञानातील गुंतवणूक सर्वोत्तम व्याज देते.",
    },
    {
        en: "The expert in anything was once a beginner.",
        hi: "किसी भी चीज़ का विशेषज्ञ कभी नौसिखिया ही था।",
        mr: "कोणत्याही गोष्टीतील तज्ञ एकेकाळी नवशिक्या होता.",
    }
];

const DailyDose = () => {
    const [quote, setQuote] = useState({ en: '', hi: '', mr: '' });

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setQuote(quotes[randomIndex]);
    }, []);
    
    return (
        <Card className="w-full h-full">
            <CardHeader className="flex flex-row items-center gap-2">
                <Lightbulb className="w-6 h-6 text-primary"/>
                <CardTitle className="font-headline">Daily Dose of Inspiration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">English:</p>
                    <p className="italic text-sm">"{quote.en}"</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">हिन्दी (Hindi):</p>
                    <p className="italic text-sm">"{quote.hi}"</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">मराठी (Marathi):</p>
                    <p className="italic text-sm">"{quote.mr}"</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default DailyDose;
