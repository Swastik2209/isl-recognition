/**
 * ISL (Indian Sign Language) Vocabulary
 *
 * Comprehensive ISL signs with Hindi/Devanagari labels.
 * Organized by category for structured learning.
 * This is an in-browser heuristic vocabulary - no model required.
 */

export interface ISLSign {
  id: string;
  label: string;
  labelHindi?: string;
  category: 'alphabet' | 'number' | 'word' | 'phrase';
  description: string;
  keywords?: string[];
}

export const ISL_SIGNS: readonly ISLSign[] = Object.freeze([
  // ==================== ALPHABET (A-Z) ====================
  { id: 'isl-a', label: 'A', labelHindi: 'अ', category: 'alphabet', description: 'Thumb tucked alongside index finger, other fingers curled', keywords: ['a', 'अ'] },
  { id: 'isl-b', label: 'B', labelHindi: 'ब', category: 'alphabet', description: 'Fingers straight and together, thumb tucked across palm', keywords: ['b', 'ब'] },
  { id: 'isl-c', label: 'C', labelHindi: 'क', category: 'alphabet', description: 'Hand forms a C shape with curved fingers and thumb', keywords: ['c', 'क'] },
  { id: 'isl-d', label: 'D', labelHindi: 'ड', category: 'alphabet', description: 'Index finger straight up, other fingers curled, thumb touches middle finger', keywords: ['d', 'ड'] },
  { id: 'isl-e', label: 'E', labelHindi: 'ए', category: 'alphabet', description: 'Fingers curled down, thumb tucked under fingertips', keywords: ['e', 'ए'] },
  { id: 'isl-f', label: 'F', labelHindi: 'फ', category: 'alphabet', description: 'Index finger and thumb touch forming circle, other fingers straight', keywords: ['f', 'फ'] },
  { id: 'isl-g', label: 'G', labelHindi: 'ग', category: 'alphabet', description: 'Index finger and thumb extended sideways, other fingers curled', keywords: ['g', 'ग'] },
  { id: 'isl-h', label: 'H', labelHindi: 'ह', category: 'alphabet', description: 'Index and middle fingers straight and together sideways, thumb tucked', keywords: ['h', 'ह'] },
  { id: 'isl-i', label: 'I', labelHindi: 'इ', category: 'alphabet', description: 'Pinky finger straight up, other fingers curled, thumb tucked', keywords: ['i', 'इ'] },
  { id: 'isl-j', label: 'J', labelHindi: 'ज', category: 'alphabet', description: 'Pinky finger traces J shape in air', keywords: ['j', 'ज'] },
  { id: 'isl-k', label: 'K', labelHindi: 'क', category: 'alphabet', description: 'Index and middle fingers up in V, thumb between them touching middle finger base', keywords: ['k', 'क'] },
  { id: 'isl-l', label: 'L', labelHindi: 'ल', category: 'alphabet', description: 'Index finger and thumb form L shape, other fingers curled', keywords: ['l', 'ल'] },
  { id: 'isl-m', label: 'M', labelHindi: 'म', category: 'alphabet', description: 'Thumb tucked under first three fingers curled down', keywords: ['m', 'म'] },
  { id: 'isl-n', label: 'N', labelHindi: 'न', category: 'alphabet', description: 'Thumb tucked under first two fingers curled down', keywords: ['n', 'न'] },
  { id: 'isl-o', label: 'O', labelHindi: 'ओ', category: 'alphabet', description: 'All fingertips touch thumb forming O shape', keywords: ['o', 'ओ'] },
  { id: 'isl-p', label: 'P', labelHindi: 'प', category: 'alphabet', description: 'Like K but wrist rotated down, index and middle pointing down', keywords: ['p', 'प'] },
  { id: 'isl-q', label: 'Q', labelHindi: 'क़', category: 'alphabet', description: 'Like G but index finger and thumb point down', keywords: ['q', 'क़'] },
  { id: 'isl-r', label: 'R', labelHindi: 'र', category: 'alphabet', description: 'Index and middle fingers crossed, other fingers curled', keywords: ['r', 'र'] },
  { id: 'isl-s', label: 'S', labelHindi: 'स', category: 'alphabet', description: 'Fist with thumb over fingers', keywords: ['s', 'स'] },
  { id: 'isl-t', label: 'T', labelHindi: 'ट', category: 'alphabet', description: 'Fist with thumb between index and middle finger', keywords: ['t', 'ट'] },
  { id: 'isl-u', label: 'U', labelHindi: 'उ', category: 'alphabet', description: 'Index and middle fingers straight up together, other fingers curled', keywords: ['u', 'उ'] },
  { id: 'isl-v', label: 'V', labelHindi: 'व', category: 'alphabet', description: 'Index and middle fingers spread in V shape', keywords: ['v', 'व'] },
  { id: 'isl-w', label: 'W', labelHindi: 'व', category: 'alphabet', description: 'Index, middle, ring fingers spread in W shape', keywords: ['w', 'व'] },
  { id: 'isl-x', label: 'X', labelHindi: 'क्स', category: 'alphabet', description: 'Index finger hooked, other fingers curled', keywords: ['x', 'क्स'] },
  { id: 'isl-y', label: 'Y', labelHindi: 'य', category: 'alphabet', description: 'Thumb and pinky extended, other fingers curled', keywords: ['y', 'य'] },
  { id: 'isl-z', label: 'Z', labelHindi: 'ज़', category: 'alphabet', description: 'Index finger traces Z shape in air', keywords: ['z', 'ज़'] },

  // ==================== NUMBERS (0-10) ====================
  { id: 'isl-0', label: '0', labelHindi: '०', category: 'number', description: 'All fingertips touch forming circle', keywords: ['0', '०', 'zero'] },
  { id: 'isl-1', label: '1', labelHindi: '१', category: 'number', description: 'Index finger straight up, others curled', keywords: ['1', '१', 'one'] },
  { id: 'isl-2', label: '2', labelHindi: '२', category: 'number', description: 'Index and middle fingers straight up', keywords: ['2', '२', 'two'] },
  { id: 'isl-3', label: '3', labelHindi: '३', category: 'number', description: 'Thumb, index, middle straight up (or index, middle, ring)', keywords: ['3', '३', 'three'] },
  { id: 'isl-4', label: '4', labelHindi: '४', category: 'number', description: 'Four fingers straight up, thumb tucked', keywords: ['4', '४', 'four'] },
  { id: 'isl-5', label: '5', labelHindi: '५', category: 'number', description: 'All five fingers spread wide', keywords: ['5', '५', 'five'] },
  { id: 'isl-6', label: '6', labelHindi: '६', category: 'number', description: 'Pinky, ring, middle, index up, thumb touches pinky base', keywords: ['6', '६', 'six'] },
  { id: 'isl-7', label: '7', labelHindi: '७', category: 'number', description: 'Ring, middle, index up, thumb touches ring base', keywords: ['7', '७', 'seven'] },
  { id: 'isl-8', label: '8', labelHindi: '८', category: 'number', description: 'Middle, index up, thumb touches middle base', keywords: ['8', '८', 'eight'] },
  { id: 'isl-9', label: '9', labelHindi: '९', category: 'number', description: 'Index up, thumb touches index base', keywords: ['9', '९', 'nine'] },
  { id: 'isl-10', label: '10', labelHindi: '१०', category: 'number', description: 'Thumb up, other fingers curled (thumbs up)', keywords: ['10', '१०', 'ten'] },

  // ==================== COMMON WORDS ====================
  // Greetings & Basics
  { id: 'isl-hello', label: 'Hello', labelHindi: 'नमस्ते', category: 'word', description: 'Wave hand near head or traditional namaste gesture', keywords: ['hello', 'नमस्ते', 'namaste', 'greeting'] },
  { id: 'isl-goodbye', label: 'Goodbye', labelHindi: 'अलविदा', category: 'word', description: 'Wave hand with palm facing out', keywords: ['goodbye', 'अलविदा', 'bye'] },
  { id: 'isl-thankyou', label: 'Thank You', labelHindi: 'धन्यवाद', category: 'word', description: 'Flat hand moves forward and down from chin', keywords: ['thankyou', 'thank you', 'धन्यवाद', 'thanks'] },
  { id: 'isl-sorry', label: 'Sorry', labelHindi: 'माफ़ करें', category: 'word', description: 'Fist rubs circular motion on chest', keywords: ['sorry', 'माफ़', 'apologize'] },
  { id: 'isl-please', label: 'Please', labelHindi: 'कृपया', category: 'word', description: 'Flat hand rubs circular motion on chest', keywords: ['please', 'कृपया'] },
  { id: 'isl-welcome', label: 'Welcome', labelHindi: 'स्वागत', category: 'word', description: 'Flat hand moves from chest outward', keywords: ['welcome', 'स्वागत'] },

  // Responses
  { id: 'isl-yes', label: 'Yes', labelHindi: 'हाँ', category: 'word', description: 'Fist nods up and down (thumbs up)', keywords: ['yes', 'हाँ', 'yeah', 'ok'] },
  { id: 'isl-no', label: 'No', labelHindi: 'नहीं', category: 'word', description: 'Index and middle finger tap thumb repeatedly', keywords: ['no', 'नहीं', 'nope'] },
  { id: 'isl-ok', label: 'OK', labelHindi: 'ठीक है', category: 'word', description: 'Thumb and index form circle, other fingers up', keywords: ['ok', 'okay', 'ठीक'] },
  { id: 'isl-good', label: 'Good', labelHindi: 'अच्छा', category: 'word', description: 'Thumb up, moves forward from chin', keywords: ['good', 'अच्छा', 'fine'] },
  { id: 'isl-bad', label: 'Bad', labelHindi: 'बुरा', category: 'word', description: 'Flat hand flips from palm up to palm down', keywords: ['bad', 'बुरा', 'wrong'] },
  { id: 'isl-maybe', label: 'Maybe', labelHindi: 'शायद', category: 'word', description: 'Flat hand rocks side to side', keywords: ['maybe', 'शायद', 'perhaps'] },

  // People & Relationships
  { id: 'isl-mom', label: 'Mother/Mom', labelHindi: 'माँ', category: 'word', description: 'Thumb touches chin, fingers spread', keywords: ['mom', 'mother', 'माँ', 'mummy'] },
  { id: 'isl-dad', label: 'Father/Dad', labelHindi: 'पापा', category: 'word', description: 'Thumb touches forehead, fingers spread', keywords: ['dad', 'father', 'पापा', 'papa'] },
  { id: 'isl-brother', label: 'Brother', labelHindi: 'भाई', category: 'word', description: 'Index fingers point to each other', keywords: ['brother', 'भाई'] },
  { id: 'isl-sister', label: 'Sister', labelHindi: 'बहन', category: 'word', description: 'Index finger traces curve on cheek', keywords: ['sister', 'बहन'] },
  { id: 'isl-friend', label: 'Friend', labelHindi: 'दोस्त', category: 'word', description: 'Index fingers hook together twice', keywords: ['friend', 'दोस्त', 'buddy'] },
  { id: 'isl-family', label: 'Family', labelHindi: 'परिवार', category: 'word', description: 'F handshapes circle around each other', keywords: ['family', 'परिवार', 'relatives'] },
  { id: 'isl-person', label: 'Person', labelHindi: 'व्यक्ति', category: 'word', description: 'Index finger points down at palm', keywords: ['person', 'व्यक्ति', 'someone'] },
  { id: 'isl-name', label: 'Name', labelHindi: 'नाम', category: 'word', description: 'Index and middle fingers tap forehead then move forward', keywords: ['name', 'नाम'] },

  // Basic Needs
  { id: 'isl-help', label: 'Help', labelHindi: 'मदद', category: 'word', description: 'Fist on flat palm, both move up together', keywords: ['help', 'मदद', 'assist'] },
  { id: 'isl-water', label: 'Water', labelHindi: 'पानी', category: 'word', description: 'W handshape taps chin', keywords: ['water', 'पानी', 'drink'] },
  { id: 'isl-food', label: 'Food/Eat', labelHindi: 'खाना', category: 'word', description: 'Fingertips tap mouth repeatedly', keywords: ['food', 'eat', 'खाना', 'meal', 'hungry'] },
  { id: 'isl-toilet', label: 'Toilet', labelHindi: 'शौचालय', category: 'word', description: 'T handshape shakes side to side', keywords: ['toilet', 'बाथरूम', 'washroom', 'restroom'] },
  { id: 'isl-sleep', label: 'Sleep', labelHindi: 'सोना', category: 'word', description: 'Flat hand tilts against cheek', keywords: ['sleep', 'सोना', 'bed'] },
  { id: 'isl-medicine', label: 'Medicine', labelHindi: 'दवा', category: 'word', description: 'Middle finger taps palm', keywords: ['medicine', 'दवा', 'pill', 'tablet'] },
  { id: 'isl-pain', label: 'Pain/Hurt', labelHindi: 'दर्द', category: 'word', description: 'Index fingers jab toward each other', keywords: ['pain', 'hurt', 'दर्द', 'ache'] },
  { id: 'isl-sick', label: 'Sick', labelHindi: 'बीमार', category: 'word', description: 'Middle fingers touch forehead and stomach', keywords: ['sick', 'बीमार', 'ill', 'unwell'] },

  // Emotions & States
  { id: 'isl-love', label: 'Love', labelHindi: 'प्यार', category: 'word', description: 'Cross arms over chest with fists', keywords: ['love', 'प्यार', 'heart'] },
  { id: 'isl-like', label: 'Like', labelHindi: 'पसंद', category: 'word', description: 'Thumb pulls away from chest', keywords: ['like', 'पसंद', 'enjoy'] },
  { id: 'isl-happy', label: 'Happy', labelHindi: 'खुश', category: 'word', description: 'Flat hands brush up chest twice', keywords: ['happy', 'खुश', 'joy', 'glad'] },
  { id: 'isl-sad', label: 'Sad', labelHindi: 'उदास', category: 'word', description: 'Flat hands slide down face', keywords: ['sad', 'उदास', 'unhappy'] },
  { id: 'isl-angry', label: 'Angry', labelHindi: 'गुस्सा', category: 'word', description: 'Claw hand pulls from face', keywords: ['angry', 'गुस्सा', 'mad'] },
  { id: 'isl-scared', label: 'Scared', labelHindi: 'डर', category: 'word', description: 'Flat hands shake near chest', keywords: ['scared', 'afraid', 'डर', 'fear'] },
  { id: 'isl-surprised', label: 'Surprised', labelHindi: 'आश्चर्य', category: 'word', description: 'Fingers spring open at eyes', keywords: ['surprised', 'शॉक', 'wow'] },

  // Actions
  { id: 'isl-go', label: 'Go', labelHindi: 'जाओ', category: 'word', description: 'Index finger points forward', keywords: ['go', 'जाओ', 'move'] },
  { id: 'isl-stop', label: 'Stop', labelHindi: 'रुकें', category: 'word', description: 'Flat hand chops down onto other flat hand', keywords: ['stop', 'रुकें', 'halt'] },
  { id: 'isl-wait', label: 'Wait', labelHindi: 'इंतज़ार', category: 'word', description: 'Both hands wiggle fingers, palms up', keywords: ['wait', 'इंतज़ार', 'hold on'] },
  { id: 'isl-come', label: 'Come', labelHindi: 'आओ', category: 'word', description: 'Index finger beckons toward self', keywords: ['come', 'आओ', 'here'] },
  { id: 'isl-sit', label: 'Sit', labelHindi: 'बैठो', category: 'word', description: 'Two fingers sit on flat hand', keywords: ['sit', 'बैठो', 'sit down'] },
  { id: 'isl-stand', label: 'Stand', labelHindi: 'खड़े हो', category: 'word', description: 'Two fingers stand on flat hand', keywords: ['stand', 'खड़े', 'get up'] },
  { id: 'isl-walk', label: 'Walk', labelHindi: 'चलो', category: 'word', description: 'Two fingers walk on flat hand', keywords: ['walk', 'चलो', 'go'] },
  { id: 'isl-run', label: 'Run', labelHindi: 'दौड़ो', category: 'word', description: 'Two fingers run on flat hand', keywords: ['run', 'दौड़ो', 'fast'] },
  { id: 'isl-read', label: 'Read', labelHindi: 'पढ़ो', category: 'word', description: 'Flat hand as book, other hand reads', keywords: ['read', 'पढ़ो', 'book'] },
  { id: 'isl-write', label: 'Write', labelHindi: 'लिखो', category: 'word', description: 'Index finger writes on palm', keywords: ['write', 'लिखो', 'pen'] },
  { id: 'isl-learn', label: 'Learn', labelHindi: 'सीखो', category: 'word', description: 'Flat hand grabs from forehead', keywords: ['learn', 'सीखो', 'study'] },
  { id: 'isl-teach', label: 'Teach', labelHindi: 'सिखाओ', category: 'word', description: 'Flat hand gives from forehead', keywords: ['teach', 'सिखाओ', 'show'] },
  { id: 'isl-work', label: 'Work', labelHindi: 'काम', category: 'word', description: 'S handshapes tap wrists together', keywords: ['work', 'काम', 'job'] },
  { id: 'isl-play', label: 'Play', labelHindi: 'खेलो', category: 'word', description: 'Y handshapes shake', keywords: ['play', 'खेलो', 'game'] },

  // Time
  { id: 'isl-time', label: 'Time', labelHindi: 'समय', category: 'word', description: 'Index finger taps wrist where watch would be', keywords: ['time', 'समय', 'clock'] },
  { id: 'isl-today', label: 'Today', labelHindi: 'आज', category: 'word', description: 'Both A hands drop down from cheeks', keywords: ['today', 'आज', 'now'] },
  { id: 'isl-tomorrow', label: 'Tomorrow', labelHindi: 'कल', category: 'word', description: 'Thumb moves from cheek forward twice', keywords: ['tomorrow', 'कल', 'next day'] },
  { id: 'isl-yesterday', label: 'Yesterday', labelHindi: 'कल', category: 'word', description: 'Thumb moves from cheek backward twice', keywords: ['yesterday', 'कल', 'previous day'] },
  { id: 'isl-morning', label: 'Morning', labelHindi: 'सुबह', category: 'word', description: 'Flat hand rises like sun', keywords: ['morning', 'सुबह', 'dawn'] },
  { id: 'isl-night', label: 'Night', labelHindi: 'रात', category: 'word', description: 'Flat hand arcs down like sunset', keywords: ['night', 'रात', 'evening'] },
  { id: 'isl-week', label: 'Week', labelHindi: 'सप्ताह', category: 'word', description: 'Index finger slides across palm', keywords: ['week', 'सप्ताह'] },
  { id: 'isl-month', label: 'Month', labelHindi: 'महीना', category: 'word', description: 'Flat hand slides down arm', keywords: ['month', 'महीना'] },
  { id: 'isl-year', label: 'Year', labelHindi: 'साल', category: 'word', description: 'Fist circles around other fist', keywords: ['year', 'साल'] },

  // Question Words
  { id: 'isl-what', label: 'What', labelHindi: 'क्या', category: 'word', description: 'Index finger moves side to side, palm up', keywords: ['what', 'क्या'] },
  { id: 'isl-where', label: 'Where', labelHindi: 'कहाँ', category: 'word', description: 'Index finger points and moves side to side', keywords: ['where', 'कहाँ'] },
  { id: 'isl-when', label: 'When', labelHindi: 'कब', category: 'word', description: 'Index finger circles wrist of other hand', keywords: ['when', 'कब'] },
  { id: 'isl-who', label: 'Who', labelHindi: 'कौन', category: 'word', description: 'Index finger circles near mouth/chin', keywords: ['who', 'कौन'] },
  { id: 'isl-why', label: 'Why', labelHindi: 'क्यों', category: 'word', description: 'Index finger on forehead, moves forward and down', keywords: ['why', 'क्यों'] },
  { id: 'isl-how', label: 'How', labelHindi: 'कैसे', category: 'word', description: 'Both hands palm down, roll forward alternately', keywords: ['how', 'कैसे'] },
  { id: 'isl-howmuch', label: 'How Much', labelHindi: 'कितना', category: 'word', description: 'Fingertips rub together', keywords: ['how much', 'कितना', 'price'] },

  // Understanding
  { id: 'isl-understand', label: 'Understand', labelHindi: 'समझना', category: 'word', description: 'Index finger flicks up from temple', keywords: ['understand', 'समझना', 'got it'] },
  { id: 'isl-dont-understand', label: "Don't Understand", labelHindi: 'नहीं समझा', category: 'word', description: 'Index finger flicks down from temple', keywords: ["don't understand", 'नहीं समझा', 'confused'] },
  { id: 'isl-know', label: 'Know', labelHindi: 'जानना', category: 'word', description: 'Index finger taps temple', keywords: ['know', 'जानना', 'aware'] },
  { id: 'isl-dont-know', label: "Don't Know", labelHindi: 'नहीं जानता', category: 'word', description: 'Shoulders shrug, palms up', keywords: ["don't know", 'नहीं पता', 'unsure'] },
  { id: 'isl-think', label: 'Think', labelHindi: 'सोचना', category: 'word', description: 'Index finger circles at temple', keywords: ['think', 'सोचना', 'thought'] },
  { id: 'isl-remember', label: 'Remember', labelHindi: 'याद करना', category: 'word', description: 'Thumb pulls from temple', keywords: ['remember', 'याद', 'memory'] },
  { id: 'isl-forget', label: 'Forget', labelHindi: 'भूलना', category: 'word', description: 'Flat hand wipes forehead', keywords: ['forget', 'भूलना', 'forgot'] },

  // Places
  { id: 'isl-home', label: 'Home', labelHindi: 'घर', category: 'word', description: 'Fingertips touch cheek, then move to other cheek', keywords: ['home', 'घर', 'house'] },
  { id: 'isl-school', label: 'School', labelHindi: 'स्कूल', category: 'word', description: 'Clap hands twice', keywords: ['school', 'स्कूल', 'college'] },
  { id: 'isl-hospital', label: 'Hospital', labelHindi: 'अस्पताल', category: 'word', description: 'Cross fingers on palm', keywords: ['hospital', 'अस्पताल', 'clinic'] },
  { id: 'isl-market', label: 'Market/Shop', labelHindi: 'बाज़ार', category: 'word', description: 'Flat hand rubs thumb', keywords: ['market', 'shop', 'बाज़ार', 'store'] },
  { id: 'isl-office', label: 'Office', labelHindi: 'ऑफिस', category: 'word', description: 'Fingers tap on palm like typing', keywords: ['office', 'ऑफिस', 'workplace'] },
  { id: 'isl-temple', label: 'Temple', labelHindi: 'मंदिर', category: 'word', description: 'Prayer hands at forehead', keywords: ['temple', 'मंदिर', 'church', 'mosque'] },

  // Communication
  { id: 'isl-talk', label: 'Talk/Speak', labelHindi: 'बोलो', category: 'word', description: 'Four fingers open and close at mouth', keywords: ['talk', 'speak', 'बोलो', 'say'] },
  { id: 'isl-listen', label: 'Listen', labelHindi: 'सुनो', category: 'word', description: 'Hand cups behind ear', keywords: ['listen', 'सुनो', 'hear'] },
  { id: 'isl-phone', label: 'Phone', labelHindi: 'फोन', category: 'word', description: 'Y handshape at ear', keywords: ['phone', 'फोन', 'call', 'mobile'] },
  { id: 'isl-sign', label: 'Sign Language', labelHindi: 'सांकेतिक भाषा', category: 'word', description: 'Index fingers spiral around each other', keywords: ['sign', 'sign language', 'सांकेतिक भाषा', 'isl'] },
  { id: 'isl-again', label: 'Again/Repeat', labelHindi: 'फिर से', category: 'word', description: 'Flat hand arcs back toward body', keywords: ['again', 'repeat', 'फिर से', 'once more'] },
  { id: 'isl-slow', label: 'Slow', labelHindi: 'धीरे', category: 'word', description: 'Dominant hand slides slowly up non-dominant arm', keywords: ['slow', 'धीरे', 'slowly'] },
  { id: 'isl-fast', label: 'Fast', labelHindi: 'तेज़', category: 'word', description: 'Dominant hand slides quickly up arm', keywords: ['fast', 'तेज़', 'quick'] },

  // Colors
  { id: 'isl-red', label: 'Red', labelHindi: 'लाल', category: 'word', description: 'Index finger brushes lips', keywords: ['red', 'लाल'] },
  { id: 'isl-blue', label: 'Blue', labelHindi: 'नीला', category: 'word', description: 'B handshape twists', keywords: ['blue', 'नीला'] },
  { id: 'isl-green', label: 'Green', labelHindi: 'हरा', category: 'word', description: 'G handshape twists', keywords: ['green', 'हरा'] },
  { id: 'isl-yellow', label: 'Yellow', labelHindi: 'पीला', category: 'word', description: 'Y handshape twists', keywords: ['yellow', 'पीला'] },
  { id: 'isl-black', label: 'Black', labelHindi: 'काला', category: 'word', description: 'Index finger draws line on forehead', keywords: ['black', 'काला'] },
  { id: 'isl-white', label: 'White', labelHindi: 'सफेद', category: 'word', description: 'Flat hand brushes chest', keywords: ['white', 'सफेद'] },

  // ==================== PHRASES ====================
  { id: 'isl-goodmorning', label: 'Good Morning', labelHindi: 'सुप्रभात', category: 'phrase', description: 'Good + Morning signs combined', keywords: ['good morning', 'सुप्रभात', 'gm'] },
  { id: 'isl-goodevening', label: 'Good Evening', labelHindi: 'शुभ संध्या', category: 'phrase', description: 'Good + Evening signs combined', keywords: ['good evening', 'शुभ संध्या'] },
  { id: 'isl-goodnight', label: 'Good Night', labelHindi: 'शुभ रात्रि', category: 'phrase', description: 'Good + Night signs combined', keywords: ['good night', 'शुभ रात्रि'] },
  { id: 'isl-howareyou', label: 'How Are You', labelHindi: 'आप कैसे हैं', category: 'phrase', description: 'How + You signs combined', keywords: ['how are you', 'आप कैसे हैं'] },
  { id: 'isl-iamfine', label: 'I Am Fine', labelHindi: 'मैं ठीक हूँ', category: 'phrase', description: 'I + Good signs combined', keywords: ['i am fine', 'i am good', 'मैं ठीक हूँ'] },
  { id: 'isl-mynameis', label: 'My Name Is', labelHindi: 'मेरा नाम है', category: 'phrase', description: 'Name + I signs combined', keywords: ['my name is', 'मेरा नाम'] },
  { id: 'isl-whatisyourname', label: 'What Is Your Name', labelHindi: 'आपका नाम क्या है', category: 'phrase', description: 'What + Name + You signs combined', keywords: ['what is your name', 'आपका नाम'] },
  { id: 'isl-whereareyoufrom', label: 'Where Are You From', labelHindi: 'आप कहाँ से हैं', category: 'phrase', description: 'Where + You + From signs combined', keywords: ['where are you from', 'आप कहाँ से'] },
  { id: 'isl-doyouknowisl', label: 'Do You Know ISL', labelHindi: 'क्या आप ISL जानते हैं', category: 'phrase', description: 'You + Know + ISL signs combined', keywords: ['do you know isl', 'do you know sign language'] },
  { id: 'isl-icanhelp', label: 'I Can Help', labelHindi: 'मैं मदद कर सकता हूँ', category: 'phrase', description: 'I + Can + Help signs combined', keywords: ['i can help', 'मैं मदद कर सकता हूँ'] },
  { id: 'isl-pleasewait', label: 'Please Wait', labelHindi: 'कृपया इंतज़ार करें', category: 'phrase', description: 'Please + Wait signs combined', keywords: ['please wait', 'कृपया इंतज़ार'] },
  { id: 'isl-thankyouverymuch', label: 'Thank You Very Much', labelHindi: 'बहुत धन्यवाद', category: 'phrase', description: 'Thank You + Very + Much signs combined', keywords: ['thank you very much', 'बहुत धन्यवाद'] },
  { id: 'isl-excuseme', label: 'Excuse Me', labelHindi: 'माफ़ कीजिए', category: 'phrase', description: 'Sorry + Please signs combined', keywords: ['excuse me', 'माफ़ कीजिए'] },
  { id: 'isl-happybirthday', label: 'Happy Birthday', labelHindi: 'जन्मदिन मुबारक', category: 'phrase', description: 'Happy + Birthday signs combined', keywords: ['happy birthday', 'जन्मदिन मुबारक'] },
  { id: 'isl-merrychristmas', label: 'Merry Christmas', labelHindi: 'मेरी क्रिसमस', category: 'phrase', description: 'Happy + Christmas signs combined', keywords: ['merry christmas', 'मेरी क्रिसमस'] },
  { id: 'isl-happynewyear', label: 'Happy New Year', labelHindi: 'नया साल मुबारक', category: 'phrase', description: 'Happy + New + Year signs combined', keywords: ['happy new year', 'नया साल मुबारक'] },
  { id: 'isl-congratulations', label: 'Congratulations', labelHindi: 'बधाई हो', category: 'phrase', description: 'Clap hands, then good sign', keywords: ['congratulations', 'बधाई हो', 'congrats'] },
  { id: 'isl-bestof luck', label: 'Best of Luck', labelHindi: 'शुभकामनाएं', category: 'phrase', description: 'Good + Luck signs combined', keywords: ['best of luck', 'good luck', 'शुभकामनाएं'] },
  { id: 'isl-takecare', label: 'Take Care', labelHindi: 'अपना ख्याल रखना', category: 'phrase', description: 'Care + Good signs combined', keywords: ['take care', 'अपना ख्याल रखना'] },
  { id: 'isl-seeyoulater', label: 'See You Later', labelHindi: 'फिर मिलेंगे', category: 'phrase', description: 'See + You + Later signs combined', keywords: ['see you later', 'फिर मिलेंगे', 'bye'] },
]);

export const ISL_ALPHABET: readonly ISLSign[] = Object.freeze(ISL_SIGNS.filter(s => s.category === 'alphabet'));
export const ISL_NUMBERS: readonly ISLSign[] = Object.freeze(ISL_SIGNS.filter(s => s.category === 'number'));
export const ISL_WORDS: readonly ISLSign[] = Object.freeze(ISL_SIGNS.filter(s => s.category === 'word'));
export const ISL_PHRASES: readonly ISLSign[] = Object.freeze(ISL_SIGNS.filter(s => s.category === 'phrase'));

export const ISL_COMMON_STARTERS: readonly ISLSign[] = Object.freeze([
  'isl-hello', 'isl-thankyou', 'isl-sorry', 'isl-please', 'isl-yes', 'isl-no',
  'isl-water', 'isl-food', 'isl-help', 'isl-mom', 'isl-dad', 'isl-friend',
  'isl-love', 'isl-good', 'isl-bad', 'isl-ok', 'isl-stop', 'isl-wait',
  'isl-understand', 'isl-dont-understand', 'isl-know', 'isl-dont-know',
].map(id => ISL_SIGNS.find(s => s.id === id)!).filter(Boolean));

export const ISL_CLASS_COUNT = ISL_SIGNS.length;

export function getSignById(id: string): ISLSign | undefined {
  return ISL_SIGNS.find(s => s.id === id);
}

export function getSignsByCategory(category: ISLSign['category']): readonly ISLSign[] {
  return ISL_SIGNS.filter(s => s.category === category);
}

export function searchSigns(query: string): readonly ISLSign[] {
  const lower = query.toLowerCase();
  return ISL_SIGNS.filter(s =>
    s.label.toLowerCase().includes(lower) ||
    s.labelHindi?.toLowerCase().includes(lower) ||
    s.description.toLowerCase().includes(lower) ||
    s.keywords?.some(k => k.toLowerCase().includes(lower))
  );
}

export function getISLCategories(): { category: ISLSign['category']; count: number; label: string }[] {
  return [
    { category: 'alphabet', count: ISL_ALPHABET.length, label: 'Alphabet (A-Z)' },
    { category: 'number', count: ISL_NUMBERS.length, label: 'Numbers (0-10)' },
    { category: 'word', count: ISL_WORDS.length, label: 'Common Words' },
    { category: 'phrase', count: ISL_PHRASES.length, label: 'Useful Phrases' },
  ];
}