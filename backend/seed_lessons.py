from utils.database import get_db_connection

STAGES = [
    (1, "Keyboard Basics", "⌨️"),
    (2, "Key Combinations & Words", "🔤"),
    (3, "Sentences & Paragraphs", "📄"),
    (4, "Timed Tests & Advanced", "⏱️"),
]

# lesson type ke hisaab se pass accuracy (configurable, yahin badlo)
PASS_ACCURACY = {
    "character": 85, "combination": 90, "word": 90,
    "sentence": 90, "paragraph": 90, "timed": 92,
}

# (stage, number, title, objective, type, exercises, min_wpm)
LESSONS = [
    (1, 1, "Home Row: Left Hand (A S D F)", "Left fingers ko A S D F par rakho aur bina dekhe keys dabao.", "character",
     ["a s d f a s d f", "f d s a f d s a", "asdf fdsa asdf fdsa"], None),
    (1, 2, "Home Row: Right Hand (J K L ;)", "Right fingers ko J K L ; par rakho.", "character",
     ["j k l ; j k l ;", ";lkj ;lkj ;lkj", "jkl; ;lkj jkl; ;lkj"], None),
    (1, 3, "Full Home Row", "Dono haath ek saath home row par.", "character",
     ["asdf jkl; asdf jkl;", "fj dk sl a; fj dk sl a;", "dad sad lad fad ask"], None),
    (1, 4, "Reaching G and H", "Index finger se G aur H tak pahunchna.", "character",
     ["fg fg jh jh fg jh", "gag hag flag half", "glad shall flash shaggy"], None),
    (1, 5, "Spacebar Rhythm", "Thumb se space dabana, rhythm banaye rakhna.", "character",
     ["a a a ; ; ; a ; a ;", "ask a lad; ask a dad", "a sad lad; a glad dad"], None),
    (1, 6, "Top Row (Q to P)", "Upar ki row ki keys bina haath hilaye.", "character",
     ["q w e r q w e r", "u i o p u i o p", "qwer uiop qwer uiop"], None),
    (1, 7, "Bottom Row (Z to .)", "Neeche ki row ki keys.", "character",
     ["z x c v z x c v", "n m , . n m , .", "zxcv nm,. zxcv nm,."], None),
    (1, 8, "Shift and Capital Letters", "Doosre haath ki Shift se capital letters.", "character",
     ["Aa Ss Dd Ff Jj Kk Ll", "Sam Dan Kim Lee Paul", "Ask Dad. Ask Sam."], None),
    (1, 9, "Common Punctuation", "Comma, full stop, ? aur ! ka practice.", "character",
     [". , ; . , ;", "Yes, no; stop. Go!", "Hello, world! Is it? Yes."], None),

    (2, 1, "Top + Home Row Combinations", "Home aur top row ki keys milakar.", "combination",
     ["we re ur ie as df jk", "far red sue lie wed", "dust fuel wire used"], None),
    (2, 2, "Bottom + Home Row Combinations", "Home aur bottom row ki keys milakar.", "combination",
     ["za xs cd vf nj mk", "cad vex man zap", "mask jazz fan van"], None),
    (2, 3, "Left and Right Hand Coordination", "Dono haathon ka tal-mel.", "combination",
     ["fj dk sl a; fj dk sl a;", "the and but for you", "jump quick lazy brown"], None),
    (2, 4, "Short Words", "Chhote common words.", "word",
     ["cat dog sun map pen cup", "red big hot fun sky box", "the and for you are not"], None),
    (2, 5, "Longer Words", "Lambe words, rhythm ke saath.", "word",
     ["keyboard practice student teacher", "morning evening weekend holiday", "computer internet program project"], None),
    (2, 6, "Words with Spaces", "Words ke beech spaces ka sahi flow.", "word",
     ["the quick brown fox", "over the lazy dog", "time and tide wait for none"], None),

    (3, 1, "Short Sentences", "Chhote sentences capital aur full stop ke saath.", "sentence",
     ["The sun is bright.", "We like to type fast.", "Practice makes you better."], None),
    (3, 2, "Capitals and Punctuation", "Sentences mein capital aur punctuation.", "sentence",
     ["Hello, my name is Ajay.", "Are you ready? Yes, I am!", "Today is Monday, and it is sunny."], None),
    (3, 3, "Longer Sentences", "Lambe sentences bina ruke.", "sentence",
     ["Typing every day will make your fingers faster and more accurate.",
      "A calm rhythm is better than a fast start with many mistakes.",
      "Good typists keep their eyes on the screen and trust their fingers."], None),
    (3, 4, "Short Paragraph", "Chhota paragraph.", "paragraph",
     ["Typing is a useful skill. It helps you write emails, code, and notes faster. Practice a little every day."], None),
    (3, 5, "Medium Paragraph", "Medium paragraph.", "paragraph",
     ["Learning to type without looking at the keys takes patience. At first you will make many mistakes, and that is normal. "
      "Focus on accuracy, and speed will follow naturally."], None),
    (3, 6, "Long Paragraph", "Lamba paragraph.", "paragraph",
     ["Every skilled typist started with the home row. They practiced slowly, corrected their errors, and kept a steady rhythm. "
      "Over weeks, their fingers learned the position of every key. Today they type without thinking, and so can you."], None),

    (4, 1, "30-Second Speed Check", "Typing Test page par 30 second ka test.", "timed", [], 20),
    (4, 2, "60-Second Challenge", "Typing Test page par 60 second ka test.", "timed", [], 25),
    (4, 3, "Advanced Passage", "Hard passage par accuracy aur speed.", "timed", [], 30),
]


def seed():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for number, title, icon in STAGES:
                cur.execute(
                    "INSERT INTO learning_stages (stage_number, title, icon) VALUES (%s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon)",
                    (number, title, icon),
                )
            cur.execute("SELECT id, stage_number FROM learning_stages")
            stage_ids = {r["stage_number"]: r["id"] for r in cur.fetchall()}

            for stage, num, title, objective, ltype, exercises, min_wpm in LESSONS:
                cur.execute(
                    "INSERT INTO learning_lessons "
                    "(stage_id, lesson_number, title, objective, lesson_type, pass_accuracy, min_wpm) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE title = VALUES(title), objective = VALUES(objective), "
                    "lesson_type = VALUES(lesson_type), pass_accuracy = VALUES(pass_accuracy), "
                    "min_wpm = VALUES(min_wpm)",
                    (stage_ids[stage], num, title, objective, ltype, PASS_ACCURACY[ltype], min_wpm),
                )
                cur.execute(
                    "SELECT id FROM learning_lessons WHERE stage_id = %s AND lesson_number = %s",
                    (stage_ids[stage], num),
                )
                lesson_id = cur.fetchone()["id"]
                for pos, text in enumerate(exercises, start=1):
                    cur.execute(
                        "INSERT INTO learning_exercises (lesson_id, position, target_text) "
                        "VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE target_text = VALUES(target_text)",
                        (lesson_id, pos, text),
                    )
        conn.commit()
        print(f"Seed done: {len(STAGES)} stages, {len(LESSONS)} lessons.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed()