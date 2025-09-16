"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPollById, submitVote } from "@/app/lib/actions/poll-actions";
import { useAuth } from "@/app/lib/context/auth-context";

type Poll = {
  id: string;
  question: string;
  options: string[];
  created_at: string;
  user_id: string;
  votes: any[];
};

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      const { poll, error } = await getPollById(params.id);
      if (error) {
        console.error(error);
      } else {
        setPoll(poll);
        const userVote = poll.votes.find((v: any) => v.user_id === user?.id);
        if (userVote) {
          setSelectedOption(userVote.option_index);
        }
      }
    };
    fetchPoll();
  }, [params.id, user?.id]);

  const handleVote = async () => {
    if (selectedOption === null || !poll) return;

    setIsSubmitting(true);
    const { error } = await submitVote(poll.id, selectedOption);
    if (error) {
      console.error(error);
    } else {
      const { poll: updatedPoll } = await getPollById(params.id);
      setPoll(updatedPoll);
    }
    setIsSubmitting(false);
  };

  const getPercentage = (optionIndex: number) => {
    if (!poll || poll.votes.length === 0) return 0;
    const votesForOption = poll.votes.filter(
      (vote: any) => vote.option_index === optionIndex
    ).length;
    return Math.round((votesForOption / poll.votes.length) * 100);
  };

  const hasVoted = poll?.votes.some((v: any) => v.user_id === user?.id);

  if (!poll) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {user?.id === poll.user_id && (
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/polls/${params.id}/edit`}>Edit Poll</Link>
            </Button>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasVoted ? (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {poll.options.map((option, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{option}</span>
                    <span>
                      {getPercentage(index)}% (
                      {
                        poll.votes.filter(
                          (vote: any) => vote.option_index === index
                        ).length
                      }{" "}
                      votes)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${getPercentage(index)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {poll.votes.length}
              </div>
              <Button onClick={() => {
                const newSelectedOption = prompt("Enter the new option index to vote for:");
                if (newSelectedOption !== null) {
                  setSelectedOption(parseInt(newSelectedOption));
                }
              }}>Change Vote</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedOption === index
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <Button
                onClick={handleVote}
                disabled={selectedOption === null || isSubmitting}
                className="mt-4"
              >
                {isSubmitting ? "Submitting..." : "Submit Vote"}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.user_id}</span>
          <span>
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </span>
        </CardFooter>
      </Card>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}