"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { toggleFollow } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

export function FollowButton({
  caseId,
  initialFollowing,
}: {
  caseId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await toggleFollow(caseId);
      if (!result.ok) {
        if (result.error === "signin_required") {
          router.push("/signup?next=/membership");
        } else {
          toast("Following cases is a membership feature.", {
            action: {
              label: "Learn more",
              onClick: () => router.push("/membership"),
            },
          });
        }
        return;
      }
      setFollowing(result.following);
      toast.success(
        result.following ? "You are following this case." : "Removed from your cases.",
      );
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isPending}
      className="rounded-full"
    >
      {following ? (
        <>
          <BookmarkCheck className="h-4 w-4 text-primary" /> Following
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" /> Follow case
        </>
      )}
    </Button>
  );
}
