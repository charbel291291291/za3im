import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChallengeModal } from "@/components/game/ChallengeModal";
import { toast } from "@/hooks/use-toast";
import {
  Challenge,
  DIFFICULTY_REWARDS,
  getRandomChallenge,
} from "@/game/gameData";
import { useGame } from "@/game/GameContext";

type SocialChallengePayloadV1 = {
  v: 1;
  token: string;
  senderId: string;
  senderName: string;
  createdAt: number;
  challenge: Challenge;
  senderRewardCoins: number;
  friendRewardCoins: number;
};

function randomToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function base64UrlEncode(input: string) {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(padded)));
}

function getSenderId() {
  const key = "social_sender_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = randomToken();
  localStorage.setItem(key, created);
  return created;
}

type InboxItem = {
  token: string;
  coins: number;
  createdAt: number;
  claimedAt?: number;
};

function inboxKey(senderId: string) {
  return `social_inbox_${senderId}`;
}

function playedKey() {
  return "social_played_tokens";
}

export default function SocialChallengePage() {
  const { state, dispatch } = useGame();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const encoded = params.get("c");

  const senderId = useMemo(() => getSenderId(), []);

  const [senderName, setSenderName] = useState("Boss");
  const [generated, setGenerated] = useState<SocialChallengePayloadV1 | null>(
    null,
  );
  const [playPayload, setPlayPayload] =
    useState<SocialChallengePayloadV1 | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    null,
  );
  const [playResult, setPlayResult] = useState<null | {
    won: boolean;
    coinsDelta: number;
    message: string;
  }>(null);

  const [inbox, setInbox] = useState<InboxItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(inboxKey(senderId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as InboxItem[];
      if (Array.isArray(parsed)) setInbox(parsed);
    } catch {
      return;
    }
  }, [senderId]);

  useEffect(() => {
    if (!encoded) {
      setPlayPayload(null);
      return;
    }
    try {
      const json = base64UrlDecode(encoded);
      const parsed = JSON.parse(json) as SocialChallengePayloadV1;
      if (!parsed || parsed.v !== 1) return;
      setPlayPayload(parsed);
    } catch {
      setPlayPayload(null);
    }
  }, [encoded]);

  const createChallenge = () => {
    const base = getRandomChallenge({
      difficulty: state.challengeStats.currentDifficulty,
      avoidIds: state.challengeStats.recentQuestionIds,
    });

    const baseReward = DIFFICULTY_REWARDS[base.difficulty] ?? 100;
    const payload: SocialChallengePayloadV1 = {
      v: 1,
      token: randomToken(),
      senderId,
      senderName,
      createdAt: Date.now(),
      challenge: base,
      senderRewardCoins: Math.max(50, Math.floor(baseReward * 0.6)),
      friendRewardCoins: Math.max(80, Math.floor(baseReward * 0.9)),
    };

    setGenerated(payload);
    const url = `${window.location.origin}/social?c=${encodeURIComponent(base64UrlEncode(JSON.stringify(payload)))}`;
    void navigator.clipboard?.writeText(url);
    toast({
      title: "Link copied",
      description: "Share it with a friend to start the challenge.",
    });
  };

  const shareLink = (payload: SocialChallengePayloadV1) =>
    `${window.location.origin}/social?c=${encodeURIComponent(base64UrlEncode(JSON.stringify(payload)))}`;

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const claimInboxItem = (item: InboxItem) => {
    if (item.claimedAt) return;
    dispatch({ type: "GRANT_REWARD", coins: item.coins, diamonds: 0 });
    const next = inbox.map((it) =>
      it.token === item.token ? { ...it, claimedAt: Date.now() } : it,
    );
    setInbox(next);
    localStorage.setItem(inboxKey(senderId), JSON.stringify(next));
    toast({ title: "Claimed", description: `+🪙 ${item.coins}` });
  };

  const startPlay = () => {
    if (!playPayload) return;
    if (playResult) setPlayResult(null);
    setActiveChallenge(playPayload.challenge);
  };

  const markPlayed = (token: string) => {
    const raw = localStorage.getItem(playedKey());
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = Array.isArray(list)
      ? Array.from(new Set([...list, token]))
      : [token];
    localStorage.setItem(playedKey(), JSON.stringify(next));
  };

  const hasPlayed = (token: string) => {
    const raw = localStorage.getItem(playedKey());
    if (!raw) return false;
    try {
      const list = JSON.parse(raw) as string[];
      return Array.isArray(list) && list.includes(token);
    } catch {
      return false;
    }
  };

  const handlePlayComplete = ({
    won,
    responseTimeMs,
    selectedAnswer: _selectedAnswer,
  }: {
    won: boolean;
    responseTimeMs: number;
    selectedAnswer: number | null;
  }) => {
    if (!playPayload) return;

    if (won) {
      dispatch({
        type: "CHALLENGE_WIN",
        reward: 0,
        xp: 0,
        challengeId: playPayload.challenge.id,
        difficulty: playPayload.challenge.difficulty,
        category: playPayload.challenge.category,
        responseTimeMs,
      });
    } else {
      dispatch({
        type: "CHALLENGE_LOSE",
        penalty: 0,
        challengeId: playPayload.challenge.id,
        difficulty: playPayload.challenge.difficulty,
        category: playPayload.challenge.category,
        responseTimeMs,
      });
    }

    if (hasPlayed(playPayload.token)) {
      setPlayResult({
        won,
        coinsDelta: 0,
        message: "This challenge link was already used on this device.",
      });
      setActiveChallenge(null);
      return;
    }

    markPlayed(playPayload.token);

    if (won) {
      dispatch({
        type: "GRANT_REWARD",
        coins: playPayload.friendRewardCoins,
        diamonds: 0,
      });
      setPlayResult({
        won: true,
        coinsDelta: playPayload.friendRewardCoins,
        message: "You solved it. Bonus coins awarded!",
      });
    } else {
      const item: InboxItem = {
        token: playPayload.token,
        coins: playPayload.senderRewardCoins,
        createdAt: Date.now(),
      };

      if (playPayload.senderId === senderId) {
        dispatch({
          type: "GRANT_REWARD",
          coins: playPayload.senderRewardCoins,
          diamonds: 0,
        });
        setPlayResult({
          won: false,
          coinsDelta: playPayload.senderRewardCoins,
          message: `You failed it, but you are also the sender on this device: +🪙 ${playPayload.senderRewardCoins}`,
        });
      } else {
        const key = inboxKey(playPayload.senderId);
        const raw = localStorage.getItem(key);
        const list = raw ? (JSON.parse(raw) as InboxItem[]) : [];
        const next = Array.isArray(list) ? [...list, item] : [item];
        localStorage.setItem(key, JSON.stringify(next));
        setPlayResult({
          won: false,
          coinsDelta: 0,
          message: `${playPayload.senderName} will receive coins for your failed attempt.`,
        });
      }
    }

    setActiveChallenge(null);
  };

  const isPlayMode = Boolean(playPayload);

  return (
    <div className="px-4 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-gold">🤝 Social Challenges</h2>
        <button
          onClick={() => navigate("/leaderboard")}
          className="px-3 py-1 rounded-lg bg-muted text-muted-foreground font-display text-xs"
        >
          Back
        </button>
      </div>

      {!isPlayMode ? (
        <>
          <div className="bg-surface rounded-xl border border-border p-4 shadow-card">
            <div className="font-display font-bold text-foreground">
              Send a challenge
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Generate a unique link and share it with a friend.
            </div>

            <div className="mt-3">
              <label className="text-[10px] text-muted-foreground font-display">
                Your name
              </label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="mt-1 w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground"
              />
            </div>

            <button
              onClick={createChallenge}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-fire text-foreground font-display font-bold active:scale-95 transition-transform"
            >
              Generate Challenge Link
            </button>
          </div>

          {generated && (
            <div className="bg-surface rounded-xl border border-border p-4 shadow-card space-y-2">
              <div className="font-display font-bold text-foreground">
                Share
              </div>
              <div className="text-xs text-muted-foreground">
                Friend reward: 🪙 {generated.friendRewardCoins} · If they fail:
                you earn 🪙 {generated.senderRewardCoins}
              </div>

              <div className="bg-muted rounded-lg p-3 text-[11px] break-all">
                {shareLink(generated)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(shareLink(generated));
                    toast({
                      title: "Copied",
                      description: "Link copied to clipboard.",
                    });
                  }}
                  className="py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold"
                >
                  Copy Link
                </button>
                <button
                  onClick={() =>
                    openShare(
                      `https://wa.me/?text=${encodeURIComponent(
                        `Can you beat this challenge? ${shareLink(generated)}`,
                      )}`,
                    )
                  }
                  className="py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() =>
                    openShare(
                      `https://t.me/share/url?url=${encodeURIComponent(
                        shareLink(generated),
                      )}&text=${encodeURIComponent("Challenge me!")}`,
                    )
                  }
                  className="py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold"
                >
                  Telegram
                </button>
                <button
                  onClick={() =>
                    openShare(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `Challenge me! ${shareLink(generated)}`,
                      )}`,
                    )
                  }
                  className="py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold"
                >
                  Twitter
                </button>
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(shareLink(generated));
                    toast({
                      title: "Copied",
                      description: "Paste the link into Instagram.",
                    });
                    openShare("https://www.instagram.com/");
                  }}
                  className="py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold col-span-2"
                >
                  Instagram
                </button>
              </div>
            </div>
          )}

          <div className="bg-surface rounded-xl border border-border p-4 shadow-card">
            <div className="font-display font-bold text-foreground">
              Your inbox
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Coins you earned when friends failed your challenges (this
              device).
            </div>

            <div className="mt-3 space-y-2">
              {inbox.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No rewards yet.
                </div>
              ) : (
                inbox
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div
                      key={item.token}
                      className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
                    >
                      <div className="text-xs text-foreground font-display">
                        🪙 {item.coins}
                        <span className="text-muted-foreground font-body ml-2">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        disabled={Boolean(item.claimedAt)}
                        onClick={() => claimInboxItem(item)}
                        className={`px-3 py-1 rounded-lg font-display text-[11px] font-bold
                          ${item.claimedAt ? "bg-background text-muted-foreground" : "bg-gradient-gold text-primary-foreground active:scale-95"}`}
                      >
                        {item.claimedAt ? "Claimed" : "Claim"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border p-4 shadow-card">
            <div className="font-display font-bold text-foreground">
              Challenge from {playPayload.senderName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Win: +🪙 {playPayload.friendRewardCoins} · Fail:{" "}
              {playPayload.senderName} earns 🪙 {playPayload.senderRewardCoins}
            </div>

            <div className="mt-3 bg-muted rounded-lg p-3 text-sm text-foreground font-display">
              {playPayload.challenge.question}
            </div>

            <button
              onClick={startPlay}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-fire text-foreground font-display font-bold active:scale-95 transition-transform"
            >
              Start
            </button>
          </div>

          {playResult && (
            <div className="bg-surface rounded-xl border border-border p-4 shadow-card">
              <div className="font-display font-bold text-foreground">
                {playResult.won ? "✅ Success" : "❌ Failed"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {playResult.message}
              </div>
              {playResult.coinsDelta !== 0 && (
                <div className="mt-2 font-display text-lg font-bold text-gold">
                  +🪙 {playResult.coinsDelta}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeChallenge && (
        <ChallengeModal
          challenge={activeChallenge}
          onComplete={handlePlayComplete}
          onClose={() => setActiveChallenge(null)}
        />
      )}
    </div>
  );
}
