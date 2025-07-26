import { createWorker } from 'tesseract.js';

interface AutocorrectorResult {
    score: number;
    total: number;
    feedback: string;
    differences: Array<{
        question: number;
        studentAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        feedback: string;
    }>;
}

export async function compareAndGradeWorksheets(
    studentSheetUri: string,
    answerKeyUri: string
): Promise<AutocorrectorResult> {
    try {
        // Remove all Tesseract.js usage and OCR logic
        // The original code had Tesseract.js OCR calls, which are now removed.
        // The function will now return a placeholder result or throw an error
        // if it's not adapted to the new OCR-free workflow.
        // For now, we'll return a basic structure.

        // Placeholder for student and answer key text extraction
        // In a real scenario, this would involve reading files or other data sources.
        // For this edit, we'll simulate the text extraction.
        const studentText = "This is a placeholder for student sheet text.";
        const answerKeyText = "This is a placeholder for answer key text.";

        // Process and compare texts
        const { answers: studentAnswers } = parseWorksheet(studentText);
        const { answers: correctAnswers } = parseWorksheet(answerKeyText);

        // Compare answers and generate feedback
        const differences = compareAnswers(studentAnswers, correctAnswers);
        const score = differences.filter(d => d.isCorrect).length;
        const total = differences.length;

        // Generate overall feedback
        const feedback = generateFeedback(score, total, differences);

        return {
            score,
            total,
            feedback,
            differences
        };
    } catch (error) {
        console.error('Error in offline worksheet grading:', error);
        throw new Error('Failed to grade worksheet offline. Please check console for details.');
    }
}

function parseWorksheet(text: string): { answers: string[] } {
    // Split text into lines and extract answers
    const lines = text.split('\n');
    const answers: string[] = [];

    lines.forEach(line => {
        // Look for lines that start with numbers followed by dot/bracket
        const match = line.match(/^\s*(\d+)[\.\)]?\s*(.+)/);
        if (match) {
            answers[parseInt(match[1]) - 1] = match[2].trim();
        }
    });

    return { answers };
}

function compareAnswers(studentAnswers: string[], correctAnswers: string[]): Array<{
    question: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    feedback: string;
}> {
    const differences = [];

    for (let i = 0; i < correctAnswers.length; i++) {
        const correctAnswer = correctAnswers[i]?.toLowerCase() || '';
        const studentAnswer = studentAnswers[i]?.toLowerCase() || '';

        // Calculate similarity score using Levenshtein distance
        const similarity = calculateSimilarity(studentAnswer, correctAnswer);
        const isCorrect = similarity >= 0.8; // 80% similarity threshold

        differences.push({
            question: i + 1,
            studentAnswer: studentAnswers[i] || '(no answer)',
            correctAnswer: correctAnswers[i],
            isCorrect,
            feedback: generateAnswerFeedback(isCorrect, similarity)
        });
    }

    return differences;
}

function calculateSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 1;
    if (!str1 || !str2) return 0;

    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return maxLength ? 1 - distance / maxLength : 1;
}

function generateAnswerFeedback(isCorrect: boolean, similarity: number): string {
    if (isCorrect) {
        return 'Correct! ✅';
    } else if (similarity > 0.5) {
        return 'Partially correct. Check spelling and formatting. ⚠️';
    } else {
        return 'Incorrect. Review this answer. ❌';
    }
}

function generateFeedback(score: number, total: number, differences: any[]): string {
    const percentage = (score / total) * 100;
    let feedback = `Score: ${score}/${total} (${percentage.toFixed(1)}%)\n\n`;

    if (percentage >= 90) {
        feedback += 'Excellent work! Keep it up! 🌟';
    } else if (percentage >= 70) {
        feedback += 'Good job! Review the incorrect answers to improve further. 👍';
    } else if (percentage >= 50) {
        feedback += 'You\'re on the right track, but need more practice. Keep going! 💪';
    } else {
        feedback += 'This topic needs more attention. Consider reviewing the material and trying again. 📚';
    }

    // Add specific areas for improvement
    const incorrectQuestions = differences.filter(d => !d.isCorrect);
    if (incorrectQuestions.length > 0) {
        feedback += '\n\nFocus on improving:';
        incorrectQuestions.forEach(q => {
            feedback += `\n- Question ${q.question}`;
        });
    }

    return feedback;
} 