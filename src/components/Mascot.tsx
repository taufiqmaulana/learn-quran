import mascotUrl from "../img/mascot.png";

/** mascot.png is 417×550; set both sides so absolutely positioned uses can't collapse it. */
const ASPECT = 417 / 550;

interface Props {
  /** Height in px; width follows the image's aspect ratio. */
  size?: number;
  /** Optional speech bubble text. */
  says?: string;
  /** Show the "Zayn" name tag under him (off for small decorative uses). */
  named?: boolean;
  className?: string;
}

/** Zayn, the little friend who reads along with the kids. */
export function Mascot({ size = 72, says, named = true, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <figure className="flex shrink-0 flex-col items-center">
        <img
          src={mascotUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          width={Math.round(size * ASPECT)}
          height={size}
          className="animate-float select-none"
        />
        {named && (
          <figcaption className="-mt-1 rounded-full bg-leaf px-2.5 text-sm font-black leading-6 text-white shadow-sm">
            Zayn
          </figcaption>
        )}
      </figure>
      {says && (
        <div className="relative rounded-2xl bg-white px-4 py-2 text-lg font-bold shadow-sm animate-pop-in">
          <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white" />
          <span className="relative">{says}</span>
        </div>
      )}
    </div>
  );
}
