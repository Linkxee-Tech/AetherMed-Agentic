const ENGLISH_LABELS = {
    LOW: 'Low',
    MODERATE: 'Moderate',
    HIGH: 'High',
    EMERGENCY: 'Emergency'
};

const ENGLISH_TEMPLATES = {
    concernIntro: 'The main concern is',
    concernBridge: 'Based on the information available,',
    safeGuidanceIntro: 'Suggested safe next steps',
    referralPrefix: 'Best next step',
    final: {
        LOW: 'This appears low risk right now. Use basic self-care and seek medical review if symptoms worsen or do not improve.',
        MODERATE: 'This appears to need medical review soon. Monitor closely and arrange a clinic visit if symptoms are not improving or new symptoms appear.',
        HIGH: 'This appears serious and needs urgent medical review today. Please do not delay an in-person assessment.',
        EMERGENCY: 'This may be an emergency. Seek emergency care immediately or call local emergency services now.'
    }
};

const COMMON_TEXT_KEYS = {
    emergencyReason: 'Red-flag symptoms suggest a potentially time-sensitive condition that requires emergency evaluation.',
    urgentReason: 'The symptom pattern suggests urgent in-person assessment is appropriate today.',
    mediumReason: 'Symptoms appear clinically important but do not immediately suggest a life-threatening emergency from the available history.',
    lowReason: 'No immediate red flags were detected from the limited symptom description, but monitoring and routine follow-up may still be needed.',
    abortionReason: 'This is a direct reproductive-health medication request rather than a simple symptom report and needs clinician review for confirmation, options, and safety.',
    abortionHighReason: 'Pregnancy termination concerns with possible warning signs need urgent in-person reproductive or emergency assessment.',
    emergencyEscalation: 'Emergency escalation',
    immediateExam: 'Immediate physical examination',
    doNotTravelAlone: 'Do not self-transport alone',
    urgentEvaluation: 'Urgent clinical evaluation',
    physicalTests: 'Physical tests may be needed',
    monitorProgression: 'Monitor progression',
    symptomNotes: 'Use safe symptom notes',
    hydrationSupport: 'Hydration support',
    clinicianGuidedCare: 'Clinician-guided reproductive care',
    avoidUnverified: 'Do not use unverified tablets',
    emergencyWarningSigns: 'Emergency warning signs',
    emergencyAction: 'Seek emergency care immediately or call local emergency services now.',
    examAction: 'Go to the hospital for urgent physical examination, vital signs, and clinician-directed tests such as ECG, labs, imaging, or oxygen assessment as needed.',
    transportAction: 'If you feel faint, confused, or unable to breathe normally, ask for immediate assistance.',
    urgentEvalAction: 'Arrange same-day in-person medical assessment as soon as possible.',
    physicalTestsAction: 'A doctor or urgent-care clinician may need to examine you and decide on tests such as blood work, swabs, imaging, or other examinations based on your symptoms.',
    hydrationAction: 'Maintain fluids if tolerated while arranging care, and stop if swallowing or breathing becomes difficult.',
    monitorAction: 'Watch for worsening pain, breathing changes, confusion, or inability to keep fluids down.',
    symptomNotesAction: 'Track symptom timing, severity, and any medicines already taken for a clinician review.',
    clinicianGuidedAction: 'This request needs a licensed clinician or reproductive-health service to confirm pregnancy status, discuss options, and decide whether medication abortion is appropriate.',
    avoidUnverifiedAction: 'Do not start unknown or unverified abortion pills without professional review, because pregnancy location, timing, contraindications, and follow-up matter.',
    emergencyWarningAction: 'Seek urgent hospital care immediately if there is heavy bleeding, fainting, severe abdominal pain, fever, or worsening weakness.',
    emergencyRoom: 'Emergency Room',
    urgentCare: 'Urgent Care',
    primaryCare: 'Primary Care',
    homeCare: 'Home Care',
    womensHealth: 'Womens Health Clinic',
    emergencyReferralAction: 'Go immediately to a hospital or emergency department for physical examination and urgent tests.',
    highReferralAction: 'Seek urgent doctor or hospital evaluation today for physical examination and further tests if needed.',
    mediumReferralAction: 'Book prompt clinical follow-up and escalate if symptoms worsen.',
    lowReferralAction: 'Use home monitoring and routine follow-up if symptoms persist.',
    abortionReferralAction: 'Arrange prompt review with a licensed OB-GYN, reproductive-health clinic, or qualified doctor for pregnancy confirmation, options counseling, and safe in-person or telehealth follow-up.'
};

const LANGUAGE_PACKS = {
    Spanish: {
        nativeNames: { English: 'Ingles', Spanish: 'Espanol', French: 'Frances', Portuguese: 'Portugues', German: 'Aleman', Italian: 'Italiano', Swahili: 'Kiswahili', Hausa: 'Hausa' },
        riskLabels: { LOW: 'Bajo', MODERATE: 'Moderado', HIGH: 'Alto', EMERGENCY: 'Emergencia' },
        templates: {
            concernIntro: 'La principal preocupacion es',
            concernBridge: 'Segun la informacion disponible,',
            safeGuidanceIntro: 'Pasos seguros sugeridos',
            referralPrefix: 'Siguiente paso recomendado',
            final: {
                LOW: 'Por ahora esto parece de menor riesgo. Sigue medidas basicas de cuidado y busca revision medica si empeora o no mejora.',
                MODERATE: 'Esto parece requerir valoracion medica pronto. Vigila la evolucion y organiza una consulta si no mejora o si aparecen nuevos sintomas.',
                HIGH: 'Esto parece serio y necesita revision medica urgente hoy. No retrases una evaluacion en persona.',
                EMERGENCY: 'Esto puede ser una emergencia. Busca atencion de emergencia de inmediato o llama a los servicios de emergencia locales.'
            }
        },
        detectors: [/\bdolor\b/, /\bpecho\b/, /\bfiebre\b/, /\bmareo\b/, /\brespirar\b/, /\baborto\b/, /\bsangrado\b/, /\bdesmayo\b/],
        replacements: [[/dolor en el pecho/g, 'chest pain'], [/falta de aire/g, 'shortness of breath'], [/dificultad para respirar/g, 'difficulty breathing'], [/dolor de cabeza/g, 'headache'], [/fiebre alta/g, 'high fever'], [/fiebre/g, 'fever'], [/vomitos/g, 'vomiting'], [/vomito/g, 'vomiting'], [/nauseas/g, 'nausea'], [/mareo/g, 'dizziness'], [/fatiga/g, 'fatigue'], [/tos/g, 'cough'], [/sangrado/g, 'bleeding'], [/desmayo/g, 'fainting'], [/aborto/g, 'abortion'], [/suicidio/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'Hay signos de alarma que sugieren una condicion potencialmente urgente que necesita evaluacion de emergencia.',
            [COMMON_TEXT_KEYS.urgentReason]: 'El patron de sintomas sugiere que hoy es apropiada una evaluacion medica urgente en persona.',
            [COMMON_TEXT_KEYS.mediumReason]: 'Los sintomas parecen clinicamente importantes, pero no sugieren de inmediato una emergencia potencialmente mortal con la informacion disponible.',
            [COMMON_TEXT_KEYS.lowReason]: 'No se detectaron signos de alarma inmediatos en la descripcion limitada, pero aun puede ser necesario vigilar la evolucion y hacer seguimiento medico.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Esta es una solicitud directa sobre salud reproductiva y necesita revision clinica para confirmar la situacion, revisar opciones y mantener la seguridad.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Las preocupaciones sobre interrupcion del embarazo con posibles signos de alarma requieren evaluacion urgente en persona en salud reproductiva o emergencias.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Escalacion de emergencia',
            [COMMON_TEXT_KEYS.immediateExam]: 'Evaluacion fisica inmediata',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'No vayas solo por tus propios medios',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Evaluacion clinica urgente',
            [COMMON_TEXT_KEYS.physicalTests]: 'Pueden ser necesarias pruebas fisicas',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Vigila la evolucion',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Toma notas seguras de los sintomas',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Apoyo con hidratacion',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Atencion reproductiva guiada por un profesional',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'No uses tabletas no verificadas',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Signos de alarma',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Busca atencion de emergencia de inmediato o llama ahora a los servicios de emergencia locales.',
            [COMMON_TEXT_KEYS.examAction]: 'Ve al hospital para una evaluacion fisica urgente, toma de signos vitales y pruebas indicadas por un profesional, como ECG, analisis, imagenes o valoracion de oxigeno segun sea necesario.',
            [COMMON_TEXT_KEYS.transportAction]: 'Si te sientes a punto de desmayarte, confundido o incapaz de respirar con normalidad, pide ayuda inmediata.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Organiza una evaluacion medica presencial el mismo dia tan pronto como sea posible.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Un medico o profesional de atencion urgente puede necesitar examinarte y decidir si hacen falta analisis de sangre, hisopados, imagenes u otras pruebas segun tus sintomas.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Mantente hidratado si lo toleras mientras organizas la atencion, y detente si tragar o respirar se vuelve dificil.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Observa si empeora el dolor, cambian la respiracion, aparece confusion o no puedes retener liquidos.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Anota cuando empezaron los sintomas, su intensidad y cualquier medicamento ya tomado para revisarlo con un profesional.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Esta solicitud necesita un profesional autorizado o un servicio de salud reproductiva para confirmar el embarazo, revisar opciones y decidir si el aborto con medicamentos es apropiado.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'No inicies pastillas abortivas desconocidas o no verificadas sin revision profesional, porque importan la ubicacion del embarazo, el tiempo, las contraindicaciones y el seguimiento.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Busca atencion hospitalaria urgente de inmediato si hay sangrado abundante, desmayo, dolor abdominal intenso, fiebre o debilidad que empeora.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Sala de emergencias',
            [COMMON_TEXT_KEYS.urgentCare]: 'Atencion urgente',
            [COMMON_TEXT_KEYS.primaryCare]: 'Atencion primaria',
            [COMMON_TEXT_KEYS.homeCare]: 'Cuidados en casa',
            [COMMON_TEXT_KEYS.womensHealth]: 'Clinica de salud femenina',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Ve de inmediato a un hospital o servicio de urgencias para evaluacion fisica y pruebas urgentes.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Busca hoy una evaluacion urgente en un hospital o con un medico para una exploracion fisica y pruebas adicionales si hacen falta.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Programa una revision clinica pronta y busca atencion mas alta si los sintomas empeoran.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Haz vigilancia en casa y seguimiento rutinario si los sintomas persisten.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Organiza una revision pronta con un ginecologo autorizado, una clinica de salud reproductiva o un medico calificado para confirmar el embarazo, revisar opciones y dar seguimiento seguro.'
        }
    },
    French: {
        nativeNames: { English: 'Anglais', Spanish: 'Espagnol', French: 'Francais', Portuguese: 'Portugais', German: 'Allemand', Italian: 'Italien', Swahili: 'Swahili', Hausa: 'Haoussa' },
        riskLabels: { LOW: 'Faible', MODERATE: 'Modere', HIGH: 'Eleve', EMERGENCY: 'Urgence' },
        templates: { concernIntro: 'La preoccupation principale concerne', concernBridge: 'D apres les informations disponibles,', safeGuidanceIntro: 'Conseils de securite proposes', referralPrefix: 'Etape suivante recommandee', final: { LOW: 'Pour le moment, cela semble de faible risque. Suivez les mesures de base et demandez un avis medical si cela s aggrave ou ne s ameliore pas.', MODERATE: 'Cela semble necessiter une evaluation medicale prochainement. Surveillez l evolution et organisez une consultation si cela ne s ameliore pas ou si de nouveaux symptomes apparaissent.', HIGH: 'Cela semble serieux et justifie une evaluation medicale urgente aujourd hui. Ne retardez pas une consultation en personne.', EMERGENCY: 'Cela peut correspondre a une urgence. Cherchez des soins d urgence immediatement ou appelez les services d urgence locaux.' } },
        detectors: [/\bdouleur\b/, /\bpoitrine\b/, /\bfievre\b/, /\brespirer\b/, /\bsaignement\b/, /\bavortement\b/],
        replacements: [[/douleur thoracique/g, 'chest pain'], [/douleur a la poitrine/g, 'chest pain'], [/essoufflement/g, 'shortness of breath'], [/difficulte a respirer/g, 'difficulty breathing'], [/mal de tete/g, 'headache'], [/forte fievre/g, 'high fever'], [/fievre/g, 'fever'], [/vomissements/g, 'vomiting'], [/nausee/g, 'nausea'], [/vertige/g, 'dizziness'], [/toux/g, 'cough'], [/saignement/g, 'bleeding'], [/evanouissement/g, 'fainting'], [/avortement/g, 'abortion'], [/suicide/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'Des signes d alerte suggerent une situation potentiellement urgente qui necessite une evaluation en urgence.',
            [COMMON_TEXT_KEYS.urgentReason]: 'Le tableau des symptomes suggere qu une evaluation medicale urgente en personne est appropriee aujourd hui.',
            [COMMON_TEXT_KEYS.mediumReason]: 'Les symptomes paraissent cliniquement importants, mais les informations disponibles ne suggerent pas immediatement une urgence vitale.',
            [COMMON_TEXT_KEYS.lowReason]: 'Aucun signe d alerte immediat n a ete detecte dans la description limitee des symptomes, mais une surveillance et un suivi medical restent possibles.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Il s agit d une demande directe concernant des soins ou medicaments de sante reproductive et non d une simple liste de symptomes, avec besoin d une evaluation clinique pour confirmer la situation, discuter des options et assurer la securite.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Une demande d interruption de grossesse avec possibles signes d alerte necessite une evaluation urgente en personne en sante reproductive ou aux urgences.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Orientation vers l urgence',
            [COMMON_TEXT_KEYS.immediateExam]: 'Examen physique immediat',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'Ne vous deplacez pas seul',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Evaluation clinique urgente',
            [COMMON_TEXT_KEYS.physicalTests]: 'Des examens peuvent etre necessaires',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Surveillez l evolution',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Notez les symptomes',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Hydratation',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Prise en charge reproductive guidee par un professionnel',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'N utilisez pas de comprimes non verifies',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Signes d urgence',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Cherchez immediatement des soins d urgence ou appelez maintenant les services d urgence locaux.',
            [COMMON_TEXT_KEYS.examAction]: 'Allez a l hopital pour un examen physique urgent, la prise des signes vitaux et des examens decides par un professionnel, comme un ECG, des analyses, une imagerie ou une evaluation de l oxygene si necessaire.',
            [COMMON_TEXT_KEYS.transportAction]: 'Si vous vous sentez faible, confus ou incapable de respirer normalement, demandez une aide immediate.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Organisez une evaluation medicale en personne le jour meme aussi vite que possible.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Un medecin ou un professionnel de soins urgents peut devoir vous examiner et decider d analyses sanguines, prelevements, imagerie ou autres examens selon vos symptomes.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Buvez des liquides si vous les supportez en attendant les soins, et arretez si avaler ou respirer devient difficile.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Surveillez une aggravation de la douleur, des changements respiratoires, une confusion ou l impossibilite de garder les liquides.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Notez le debut des symptomes, leur intensite et les medicaments deja pris pour en parler a un professionnel.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Cette demande necessite un professionnel autorise ou un service de sante reproductive pour confirmer la grossesse, discuter des options et decider si l interruption medicamenteuse est adaptee.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'Ne commencez pas des pilules abortives inconnues ou non verifiees sans avis professionnel, car la localisation de la grossesse, le terme, les contre indications et le suivi sont importants.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Consultez immediatement en urgence si vous avez un saignement abondant, un malaise, une douleur abdominale intense, de la fievre ou une faiblesse qui s aggrave.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Urgences',
            [COMMON_TEXT_KEYS.urgentCare]: 'Soins urgents',
            [COMMON_TEXT_KEYS.primaryCare]: 'Soins primaires',
            [COMMON_TEXT_KEYS.homeCare]: 'Soins a domicile',
            [COMMON_TEXT_KEYS.womensHealth]: 'Clinique de sante feminine',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Allez immediatement a l hopital ou aux urgences pour un examen physique et des tests urgents.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Cherchez aujourd hui une evaluation urgente par un medecin ou a l hopital pour un examen physique et d autres tests si necessaire.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Prevoyez un suivi clinique rapide et consultez plus vite si les symptomes s aggravent.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Surveillez a domicile et prevoyez un suivi habituel si les symptomes persistent.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Organisez rapidement une evaluation avec un gynecologue autorise, une clinique de sante reproductive ou un medecin qualifie pour confirmer la grossesse, discuter des options et assurer un suivi sur place ou en teleconsultation.'
        }
    },
    Portuguese: {
        nativeNames: { English: 'Ingles', Spanish: 'Espanhol', French: 'Frances', Portuguese: 'Portugues', German: 'Alemao', Italian: 'Italiano', Swahili: 'Suaile', Hausa: 'Hausa' },
        riskLabels: { LOW: 'Baixo', MODERATE: 'Moderado', HIGH: 'Alto', EMERGENCY: 'Emergencia' },
        templates: { concernIntro: 'A principal preocupacao e', concernBridge: 'Pelas informacoes disponiveis,', safeGuidanceIntro: 'Orientacoes seguras sugeridas', referralPrefix: 'Melhor proximo passo', final: { LOW: 'No momento, isso parece de menor risco. Siga medidas basicas de cuidado e procure avaliacao medica se piorar ou nao melhorar.', MODERATE: 'Isso parece exigir avaliacao medica em breve. Observe a evolucao e organize consulta se nao melhorar ou se surgirem novos sintomas.', HIGH: 'Isso parece serio e precisa de avaliacao medica urgente hoje. Nao adie uma revisao presencial.', EMERGENCY: 'Isso pode ser uma emergencia. Procure atendimento de emergencia imediatamente ou ligue para os servicos locais de emergencia.' } },
        detectors: [/\bdor\b/, /\bpeito\b/, /\bfebre\b/, /\brespirar\b/, /\bsangramento\b/, /\baborto\b/],
        replacements: [[/dor no peito/g, 'chest pain'], [/falta de ar/g, 'shortness of breath'], [/dificuldade para respirar/g, 'difficulty breathing'], [/dor de cabeca/g, 'headache'], [/febre alta/g, 'high fever'], [/febre/g, 'fever'], [/vomitos/g, 'vomiting'], [/vomito/g, 'vomiting'], [/nausea/g, 'nausea'], [/tontura/g, 'dizziness'], [/tosse/g, 'cough'], [/sangramento/g, 'bleeding'], [/desmaio/g, 'fainting'], [/aborto/g, 'abortion'], [/suicidio/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'Ha sinais de alerta que sugerem uma condicao possivelmente urgente e que precisa de avaliacao de emergencia.',
            [COMMON_TEXT_KEYS.urgentReason]: 'O padrao dos sintomas sugere que uma avaliacao medica urgente presencial hoje e apropriada.',
            [COMMON_TEXT_KEYS.mediumReason]: 'Os sintomas parecem clinicamente importantes, mas pelas informacoes disponiveis nao sugerem imediatamente uma emergencia com risco de vida.',
            [COMMON_TEXT_KEYS.lowReason]: 'Nenhum sinal de alerta imediato foi identificado na descricao limitada dos sintomas, mas ainda pode ser necessario monitoramento e acompanhamento medico.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Este e um pedido direto sobre cuidados ou medicacao de saude reprodutiva e nao apenas uma lista de sintomas, por isso precisa de avaliacao clinica para confirmar a situacao, discutir opcoes e manter a seguranca.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Uma solicitacao relacionada a interrupcao da gravidez com possiveis sinais de alerta precisa de avaliacao urgente presencial em saude reprodutiva ou emergencia.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Escalada para emergencia',
            [COMMON_TEXT_KEYS.immediateExam]: 'Exame fisico imediato',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'Nao va sozinho por conta propria',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Avaliacao clinica urgente',
            [COMMON_TEXT_KEYS.physicalTests]: 'Pode ser necessario fazer exames',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Monitore a evolucao',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Anote os sintomas com seguranca',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Apoio para hidratacao',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Cuidado reprodutivo guiado por profissional',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'Nao use comprimidos nao verificados',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Sinais de emergencia',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Procure atendimento de emergencia imediatamente ou ligue agora para os servicos locais de emergencia.',
            [COMMON_TEXT_KEYS.examAction]: 'Va ao hospital para exame fisico urgente, verificacao dos sinais vitais e exames orientados pelo profissional, como ECG, analises, imagem ou avaliacao de oxigenio conforme necessario.',
            [COMMON_TEXT_KEYS.transportAction]: 'Se voce sentir que vai desmaiar, ficar confuso ou nao conseguir respirar normalmente, peca ajuda imediata.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Organize uma avaliacao medica presencial no mesmo dia o mais rapido possivel.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Um medico ou profissional de atendimento urgente pode precisar examinar voce e decidir por exames como analises de sangue, coletas, imagem ou outros testes de acordo com os sintomas.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Mantenha ingestao de liquidos se tolerar enquanto organiza atendimento, e pare se engolir ou respirar ficar dificil.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Observe piora da dor, mudancas na respiracao, confusao ou incapacidade de manter liquidos.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Anote quando os sintomas comecaram, a intensidade e os medicamentos ja tomados para revisar com um profissional.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Este pedido precisa de um profissional habilitado ou servico de saude reprodutiva para confirmar a gravidez, discutir opcoes e decidir se o aborto medicamentoso e apropriado.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'Nao inicie pilulas abortivas desconhecidas ou nao verificadas sem avaliacao profissional, porque importam a localizacao da gestacao, o tempo, as contraindicacoes e o acompanhamento.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Procure atendimento hospitalar urgente imediatamente se houver sangramento intenso, desmaio, dor abdominal forte, febre ou piora da fraqueza.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Pronto-socorro',
            [COMMON_TEXT_KEYS.urgentCare]: 'Atendimento urgente',
            [COMMON_TEXT_KEYS.primaryCare]: 'Atencao primaria',
            [COMMON_TEXT_KEYS.homeCare]: 'Cuidados em casa',
            [COMMON_TEXT_KEYS.womensHealth]: 'Clinica de saude da mulher',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Va imediatamente ao hospital ou pronto-socorro para exame fisico e testes urgentes.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Procure hoje avaliacao urgente com medico ou hospital para exame fisico e testes adicionais se necessario.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Agende acompanhamento clinico rapidamente e procure nivel maior de atendimento se os sintomas piorarem.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Faca monitoramento em casa e acompanhamento de rotina se os sintomas persistirem.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Providencie rapidamente uma avaliacao com ginecologista habilitado, clinica de saude reprodutiva ou medico qualificado para confirmar a gravidez, discutir opcoes e fazer acompanhamento seguro presencial ou por teleatendimento.'
        }
    },
    German: {
        nativeNames: { English: 'Englisch', German: 'Deutsch' },
        riskLabels: { LOW: 'Niedrig', MODERATE: 'Mittel', HIGH: 'Hoch', EMERGENCY: 'Notfall' },
        templates: { concernIntro: 'Das Hauptproblem ist', concernBridge: 'Nach den verfugbaren Informationen gilt:', safeGuidanceIntro: 'Sichere empfohlene Schritte', referralPrefix: 'Bester nachster Schritt', final: { LOW: 'Das wirkt derzeit eher niedrig riskant. Nutzen Sie einfache Selbsthilfe und lassen Sie es medizinisch abklaren, wenn es schlimmer wird oder nicht besser wird.', MODERATE: 'Das sollte bald medizinisch beurteilt werden. Beobachten Sie den Verlauf genau und organisieren Sie einen Arzttermin, wenn es nicht besser wird oder neue Symptome auftreten.', HIGH: 'Das wirkt ernst und braucht heute eine dringende medizinische Beurteilung. Bitte verschieben Sie die Untersuchung nicht.', EMERGENCY: 'Das kann ein Notfall sein. Suchen Sie sofort eine Notaufnahme auf oder rufen Sie jetzt den Rettungsdienst.' } },
        detectors: [/\bbrustschmerzen\b/, /\batemnot\b/, /\bfieber\b/, /\bkopfschmerzen\b/, /\bblutung\b/, /\bohnmacht\b/, /\bselbstmord\b/],
        replacements: [[/brustschmerzen/g, 'chest pain'], [/atemnot/g, 'shortness of breath'], [/schwierigkeiten beim atmen/g, 'difficulty breathing'], [/kopfschmerzen/g, 'headache'], [/hohes fieber/g, 'high fever'], [/fieber/g, 'fever'], [/erbrechen/g, 'vomiting'], [/ubelkeit/g, 'nausea'], [/schwindel/g, 'dizziness'], [/husten/g, 'cough'], [/blutung/g, 'bleeding'], [/ohnmacht/g, 'fainting'], [/abtreibung/g, 'abortion'], [/selbstmord/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'Warnzeichen deuten auf einen potenziell zeitkritischen Zustand hin, der eine Notfallbeurteilung braucht.',
            [COMMON_TEXT_KEYS.urgentReason]: 'Das Symptommuster spricht dafur, dass heute eine dringende Untersuchung vor Ort sinnvoll ist.',
            [COMMON_TEXT_KEYS.mediumReason]: 'Die Symptome wirken klinisch relevant, sprechen mit den verfugbaren Angaben aber nicht sofort fur einen lebensbedrohlichen Notfall.',
            [COMMON_TEXT_KEYS.lowReason]: 'Es wurden in der begrenzten Beschreibung keine sofortigen Warnzeichen erkannt, aber Beobachtung und normale Nachkontrolle konnen trotzdem notig sein.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Dies ist eine direkte Anfrage zu reproduktiver Versorgung und braucht eine klinische Prufung zur Bestatigung, Besprechung der Optionen und Sicherheit.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Anliegen zu einem Schwangerschaftsabbruch mit moglichen Warnzeichen brauchen eine dringende personliche Beurteilung in reproduktiver Versorgung oder im Notfall.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Sofortige Notfalleskalation',
            [COMMON_TEXT_KEYS.immediateExam]: 'Sofortige korperliche Untersuchung',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'Fahren Sie nicht alleine',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Dringende medizinische Beurteilung',
            [COMMON_TEXT_KEYS.physicalTests]: 'Korperliche Tests konnen notig sein',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Verlauf beobachten',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Sichere Symptomnotizen machen',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Flussigkeitszufuhr unterstutzen',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Reproduktive Versorgung mit fachlicher Begleitung',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'Keine ungepruften Tabletten verwenden',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Warnzeichen fur den Notfall',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Suchen Sie sofort eine Notaufnahme auf oder rufen Sie jetzt den Rettungsdienst.',
            [COMMON_TEXT_KEYS.examAction]: 'Gehen Sie ins Krankenhaus fur eine dringende korperliche Untersuchung, Vitalzeichenkontrolle und arztlich geleitete Tests wie EKG, Labor, Bildgebung oder Sauerstoffbeurteilung.',
            [COMMON_TEXT_KEYS.transportAction]: 'Wenn Sie sich benommen, verwirrt oder nicht normal atmungsfahig fuhlen, holen Sie sofort Hilfe.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Organisieren Sie so schnell wie moglich noch am selben Tag eine medizinische Untersuchung vor Ort.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Ein Arzt oder eine dringende Versorgungseinrichtung muss Sie moglicherweise untersuchen und uber Tests wie Blutuntersuchungen, Abstriche, Bildgebung oder andere Untersuchungen entscheiden.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Trinken Sie Flussigkeit, wenn Sie es vertragen, wahrend Sie Versorgung organisieren, und horen Sie auf, wenn Schlucken oder Atmen schwieriger wird.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Achten Sie auf zunehmende Schmerzen, Veranderungen der Atmung, Verwirrtheit oder darauf, dass Sie keine Flussigkeit bei sich behalten konnen.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Notieren Sie Beginn, Starke und bereits eingenommene Medikamente fur die medizinische Beurteilung.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Diese Anfrage braucht eine zugelassene Fachperson oder einen Dienst fur reproduktive Gesundheit, um den Schwangerschaftsstatus zu bestatigen, Optionen zu besprechen und zu entscheiden, ob ein medikamentoser Abbruch geeignet ist.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'Beginnen Sie keine unbekannten oder ungepruften Abtreibungstabletten ohne fachliche Beurteilung, weil Ort der Schwangerschaft, Zeitpunkt, Gegenanzeigen und Nachkontrolle wichtig sind.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Suchen Sie sofort dringend Hilfe, wenn starke Blutung, Ohnmacht, starke Bauchschmerzen, Fieber oder zunehmende Schwache auftreten.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Notaufnahme',
            [COMMON_TEXT_KEYS.urgentCare]: 'Dringende Versorgung',
            [COMMON_TEXT_KEYS.primaryCare]: 'Hausarztliche Versorgung',
            [COMMON_TEXT_KEYS.homeCare]: 'Hausliche Beobachtung',
            [COMMON_TEXT_KEYS.womensHealth]: 'Frauenklinik',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Gehen Sie sofort in ein Krankenhaus oder eine Notaufnahme fur Untersuchung und dringende Tests.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Lassen Sie sich heute dringend durch einen Arzt oder im Krankenhaus untersuchen.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Vereinbaren Sie eine zeitnahe Nachkontrolle und suchen Sie schneller Hilfe, wenn es schlimmer wird.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Beobachten Sie sich zu Hause und planen Sie eine normale Nachkontrolle, wenn die Symptome anhalten.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Organisieren Sie rasch eine Beurteilung durch eine zugelassene Frauenarztpraxis, reproduktive Klinik oder qualifizierte Arztperson fur Schwangerschaftsbestatigung, Beratung zu Optionen und sichere Nachkontrolle.'
        }
    },
    Italian: {
        nativeNames: { English: 'Inglese', Italian: 'Italiano' },
        riskLabels: { LOW: 'Basso', MODERATE: 'Moderato', HIGH: 'Alto', EMERGENCY: 'Emergenza' },
        templates: { concernIntro: 'La preoccupazione principale e', concernBridge: 'In base alle informazioni disponibili,', safeGuidanceIntro: 'Passi sicuri suggeriti', referralPrefix: 'Miglior passo successivo', final: { LOW: 'Al momento questo sembra a basso rischio. Usi misure di autocura di base e cerchi una valutazione medica se peggiora o non migliora.', MODERATE: 'Questo sembra richiedere una valutazione medica a breve. Osservi con attenzione l andamento e organizzi una visita se non migliora o se compaiono nuovi sintomi.', HIGH: 'Questo sembra serio e richiede una valutazione medica urgente oggi. Non rimandi una visita in presenza.', EMERGENCY: 'Questa potrebbe essere un emergenza. Cerchi subito assistenza di emergenza o chiami ora i servizi di emergenza locali.' } },
        detectors: [/\bdolore\b/, /\bpetto\b/, /\bfebbre\b/, /\brespirare\b/, /\bsanguinamento\b/, /\bsvenimento\b/, /\bsuicidio\b/],
        replacements: [[/dolore al petto/g, 'chest pain'], [/mancanza di respiro/g, 'shortness of breath'], [/difficolta a respirare/g, 'difficulty breathing'], [/mal di testa/g, 'headache'], [/febbre alta/g, 'high fever'], [/febbre/g, 'fever'], [/vomito/g, 'vomiting'], [/nausea/g, 'nausea'], [/vertigini/g, 'dizziness'], [/tosse/g, 'cough'], [/sanguinamento/g, 'bleeding'], [/svenimento/g, 'fainting'], [/aborto/g, 'abortion'], [/suicidio/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'I segnali di allarme suggeriscono una condizione potenzialmente urgente che richiede una valutazione in emergenza.',
            [COMMON_TEXT_KEYS.urgentReason]: 'Il quadro dei sintomi suggerisce che oggi sia appropriata una valutazione urgente di persona.',
            [COMMON_TEXT_KEYS.mediumReason]: 'I sintomi sembrano clinicamente importanti, ma con le informazioni disponibili non indicano subito un emergenza pericolosa per la vita.',
            [COMMON_TEXT_KEYS.lowReason]: 'Non sono emersi segnali di allarme immediati dalla descrizione limitata, ma potrebbe comunque servire osservazione e controllo medico.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Questa e una richiesta diretta di assistenza riproduttiva e richiede una valutazione clinica per confermare la situazione, discutere le opzioni e mantenere la sicurezza.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Richieste di interruzione di gravidanza con possibili segnali di allarme richiedono una valutazione urgente di persona in ambito riproduttivo o di emergenza.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Escalation di emergenza',
            [COMMON_TEXT_KEYS.immediateExam]: 'Valutazione fisica immediata',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'Non andare da solo',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Valutazione clinica urgente',
            [COMMON_TEXT_KEYS.physicalTests]: 'Potrebbero servire esami fisici',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Monitora l evoluzione',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Prendi note sicure sui sintomi',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Supporto con idratazione',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Assistenza riproduttiva guidata da professionisti',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'Non usare compresse non verificate',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Segnali di allarme',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Cerca subito assistenza di emergenza o chiama ora i servizi di emergenza locali.',
            [COMMON_TEXT_KEYS.examAction]: 'Vai in ospedale per una valutazione fisica urgente, controllo dei parametri vitali ed esami indicati dal medico come ECG, analisi, imaging o valutazione dell ossigeno.',
            [COMMON_TEXT_KEYS.transportAction]: 'Se ti senti svenire, confuso o incapace di respirare normalmente, chiedi aiuto immediato.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Organizza una valutazione medica in presenza nello stesso giorno il prima possibile.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Un medico o un centro di urgenza potrebbe doverti visitare e decidere esami come analisi del sangue, tamponi, imaging o altri controlli in base ai sintomi.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Mantieni i liquidi se li tolleri mentre organizzi l assistenza, e fermati se deglutire o respirare diventa piu difficile.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Osserva se il dolore peggiora, se il respiro cambia, se compare confusione o se non riesci a trattenere liquidi.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Annota quando sono iniziati i sintomi, quanto sono intensi e quali medicinali hai gia preso per mostrarli al medico.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Questa richiesta necessita di un professionista autorizzato o di un servizio di salute riproduttiva per confermare lo stato della gravidanza, discutere le opzioni e decidere se l aborto farmacologico sia appropriato.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'Non iniziare pillole abortive sconosciute o non verificate senza una valutazione professionale, perche contano sede della gravidanza, tempi, controindicazioni e follow-up.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Cerca subito assistenza urgente se compaiono forte sanguinamento, svenimento, forte dolore addominale, febbre o debolezza in peggioramento.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Pronto soccorso',
            [COMMON_TEXT_KEYS.urgentCare]: 'Cure urgenti',
            [COMMON_TEXT_KEYS.primaryCare]: 'Medicina di base',
            [COMMON_TEXT_KEYS.homeCare]: 'Cura a casa',
            [COMMON_TEXT_KEYS.womensHealth]: 'Clinica per la salute femminile',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Vai immediatamente in ospedale o al pronto soccorso per visita fisica ed esami urgenti.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Cerca oggi una valutazione urgente da parte di un medico o in ospedale per visita fisica e altri esami se necessari.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Prenota un controllo clinico rapido e aumenta il livello di assistenza se i sintomi peggiorano.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Monitora a casa e organizza un controllo di routine se i sintomi persistono.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Organizza rapidamente una valutazione con un ginecologo autorizzato, una clinica di salute riproduttiva o un medico qualificato per conferma della gravidanza, colloquio sulle opzioni e follow-up sicuro.'
        }
    },
    Swahili: {
        nativeNames: { English: 'Kiingereza', Swahili: 'Kiswahili' },
        riskLabels: { LOW: 'Hatari ndogo', MODERATE: 'Hatari ya kati', HIGH: 'Hatari kubwa', EMERGENCY: 'Dharura' },
        templates: { concernIntro: 'Tatizo kuu ni', concernBridge: 'Kwa taarifa zilizopo,', safeGuidanceIntro: 'Hatua salama zinazopendekezwa', referralPrefix: 'Hatua bora inayofuata', final: { LOW: 'Hili linaonekana kuwa na hatari ndogo kwa sasa. Tumia hatua za msingi za kujitunza na tafuta ushauri wa daktari kama hali inazidi kuwa mbaya au haiboreki.', MODERATE: 'Hili linaonekana kuhitaji tathmini ya daktari hivi karibuni. Fuatilia hali kwa karibu na panga kwenda kliniki kama haiboreki au dalili mpya zikitokea.', HIGH: 'Hili linaonekana kuwa kubwa na linahitaji tathmini ya haraka leo. Usicheleweshe uchunguzi wa ana kwa ana.', EMERGENCY: 'Hii inaweza kuwa dharura. Tafuta huduma ya dharura mara moja au piga huduma za dharura za eneo lako sasa.' } },
        detectors: [/\bmaumivu\b/, /\bkifua\b/, /\bhoma\b/, /\bkizunguzungu\b/, /\bkupumua\b/, /\bdamu\b/],
        replacements: [[/maumivu ya kifua/g, 'chest pain'], [/kupumua kwa shida/g, 'shortness of breath'], [/ugumu wa kupumua/g, 'difficulty breathing'], [/maumivu ya kichwa/g, 'headache'], [/homa kali/g, 'high fever'], [/homa/g, 'fever'], [/kutapika/g, 'vomiting'], [/kichefuchefu/g, 'nausea'], [/kizunguzungu/g, 'dizziness'], [/kikohozi/g, 'cough'], [/kutokwa na damu/g, 'bleeding'], [/kuzimia/g, 'fainting'], [/utoaji mimba/g, 'abortion'], [/kujiua/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'Dalili za hatari zinaonyesha hali inayoweza kuwa ya dharura na inahitaji tathmini ya haraka.',
            [COMMON_TEXT_KEYS.urgentReason]: 'Mfumo wa dalili unaonyesha kuwa tathmini ya haraka ya ana kwa ana inafaa leo.',
            [COMMON_TEXT_KEYS.mediumReason]: 'Dalili zinaonekana kuwa muhimu kitabibu, lakini kwa taarifa zilizopo hazionyeshi mara moja dharura ya kutishia maisha.',
            [COMMON_TEXT_KEYS.lowReason]: 'Hakuna ishara za hatari za haraka zilizobainika kutoka maelezo mafupi, lakini ufuatiliaji na mapitio ya kawaida bado yanaweza kuhitajika.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Hili ni ombi la moja kwa moja kuhusu huduma ya afya ya uzazi na linahitaji mapitio ya daktari kuthibitisha hali, kujadili chaguo na kulinda usalama.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Masuala ya kusitisha ujauzito yenye ishara za hatari yanahitaji tathmini ya haraka ya ana kwa ana katika huduma ya afya ya uzazi au dharura.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Kupeleka kwenye dharura',
            [COMMON_TEXT_KEYS.immediateExam]: 'Uchunguzi wa mwili wa haraka',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'Usiende peke yako',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Tathmini ya haraka ya daktari',
            [COMMON_TEXT_KEYS.physicalTests]: 'Vipimo vinaweza kuhitajika',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Fuatilia hali',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Andika dalili kwa usalama',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Saidia mwili kwa maji',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Huduma ya uzazi inayoongozwa na mtaalamu',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'Usitumie tembe zisizothibitishwa',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Ishara za dharura',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Tafuta huduma ya dharura mara moja au piga huduma za dharura za eneo lako sasa.',
            [COMMON_TEXT_KEYS.examAction]: 'Nenda hospitali kwa uchunguzi wa haraka wa mwili, vipimo vya alama muhimu na vipimo vinavyoamriwa na daktari kama ECG, maabara, picha au tathmini ya oksijeni.',
            [COMMON_TEXT_KEYS.transportAction]: 'Ukihisi kama unazimia, umechanganyikiwa au huwezi kupumua kawaida, omba msaada mara moja.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Panga tathmini ya kitabibu ya ana kwa ana siku hiyo hiyo haraka iwezekanavyo.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Daktari au kituo cha huduma ya haraka kinaweza kuhitaji kukuchunguza na kuamua vipimo kama damu, swab, picha au uchunguzi mwingine kulingana na dalili zako.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Endelea kunywa maji kama unaweza kuvumilia wakati unatafuta huduma, na acha ikiwa kumeza au kupumua kunakuwa kugumu zaidi.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Fuatilia maumivu yakiongezeka, mabadiliko ya kupumua, kuchanganyikiwa au kushindwa kubakiza maji.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Andika muda wa dalili, ukali wake na dawa zozote ulizotumia tayari kwa mapitio ya daktari.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Ombi hili linahitaji mtaalamu mwenye leseni au huduma ya afya ya uzazi kuthibitisha hali ya ujauzito, kujadili chaguo na kuamua kama utoaji mimba kwa dawa unafaa.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'Usianze tembe za utoaji mimba zisizojulikana au zisizothibitishwa bila mapitio ya kitaalamu, kwa sababu eneo la ujauzito, muda, vizuizi na ufuatiliaji ni muhimu.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Tafuta huduma ya haraka ya hospitali mara moja ikiwa kuna kutokwa damu nyingi, kuzimia, maumivu makali ya tumbo, homa au udhaifu unaozidi.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Chumba cha dharura',
            [COMMON_TEXT_KEYS.urgentCare]: 'Huduma ya haraka',
            [COMMON_TEXT_KEYS.primaryCare]: 'Huduma ya msingi',
            [COMMON_TEXT_KEYS.homeCare]: 'Huduma ya nyumbani',
            [COMMON_TEXT_KEYS.womensHealth]: 'Kliniki ya afya ya wanawake',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Nenda mara moja hospitali au kitengo cha dharura kwa uchunguzi wa mwili na vipimo vya haraka.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Tafuta tathmini ya haraka leo kwa daktari au hospitali kwa uchunguzi wa mwili na vipimo zaidi ikiwa vinahitajika.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Panga ufuatiliaji wa kitabibu mapema na ongeza kiwango cha huduma ikiwa dalili zinaongezeka.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Endelea kujifuatilia nyumbani na panga ufuatiliaji wa kawaida ikiwa dalili zinaendelea.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Panga mapitio ya haraka na daktari wa wanawake mwenye leseni, kliniki ya afya ya uzazi au daktari mwenye sifa kwa uthibitisho wa ujauzito, ushauri wa chaguo na ufuatiliaji salama.'
        }
    },
    Hausa: {
        nativeNames: { English: 'Turanci', Hausa: 'Hausa' },
        riskLabels: { LOW: 'Karamin hadari', MODERATE: 'Matsakaicin hadari', HIGH: 'Babban hadari', EMERGENCY: 'Gaggawa' },
        templates: { concernIntro: 'Babbar matsalar ita ce', concernBridge: 'Dangane da bayanin da ake da shi,', safeGuidanceIntro: 'Matakan tsaro da ake ba da shawara', referralPrefix: 'Mataki mafi dacewa na gaba', final: { LOW: 'Wannan yana kama da karamin hadari a yanzu. Yi matakan kula da kai na asali kuma ka nemi duba likita idan abin ya kara tsananta ko bai inganta ba.', MODERATE: 'Wannan yana kama da yana bukatar duba likita nan ba da jimawa ba. Ka sa ido sosai sannan ka shirya zuwa asibiti idan bai inganta ba ko sabbin alamomi suka bayyana.', HIGH: 'Wannan yana kama da abu mai tsanani kuma yana bukatar duba likita cikin gaggawa yau. Kada ka jinkirta zuwa a duba ka a zahiri.', EMERGENCY: 'Wannan na iya zama gaggawa. Nemi kulawar gaggawa nan da nan ko kira ma aikatan agajin gaggawa na yankinku yanzu.' } },
        detectors: [/\bciwon\b/, /\bkirji\b/, /\bzazzabi\b/, /\bnumfashi\b/, /\bzubar jini\b/, /\bsumewa\b/],
        replacements: [[/ciwon kirji/g, 'chest pain'], [/wahalar numfashi/g, 'shortness of breath'], [/matsalar numfashi/g, 'difficulty breathing'], [/ciwon kai/g, 'headache'], [/zazzabi mai tsanani/g, 'high fever'], [/zazzabi/g, 'fever'], [/amai/g, 'vomiting'], [/tashin zuciya/g, 'nausea'], [/juwa/g, 'dizziness'], [/tari/g, 'cough'], [/zubar jini/g, 'bleeding'], [/sumewa/g, 'fainting'], [/zubar da ciki/g, 'abortion'], [/kashe kai/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'Alamun gargadi suna nuna wani hali mai yiwuwa na gaggawa wanda ke bukatar a duba shi nan take.',
            [COMMON_TEXT_KEYS.urgentReason]: 'Tsarin alamomin yana nuna cewa duba kai tsaye cikin gaggawa ya dace yau.',
            [COMMON_TEXT_KEYS.mediumReason]: 'Alamomin suna da muhimmanci a bangaren lafiya, amma da bayanan da ake da su ba sa nuna gaggawar da ke iya jefa rai cikin hadari nan take.',
            [COMMON_TEXT_KEYS.lowReason]: 'Ba a gano alamun gargadi na gaggawa ba daga takaitaccen bayani, amma sa ido da kulawa na yau da kullum na iya kasancewa dole.',
            [COMMON_TEXT_KEYS.abortionReason]: 'Wannan bukata ce kai tsaye kan kula da lafiyar haihuwa kuma tana bukatar duba na likita don tabbatar da halin da ake ciki, tattauna zabi da kiyaye lafiya.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'Batun dakatar da ciki tare da yiwuwar alamun gargadi yana bukatar a duba mutum kai tsaye cikin gaggawa a sashen lafiyar haihuwa ko gaggawa.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'Tura zuwa gaggawa',
            [COMMON_TEXT_KEYS.immediateExam]: 'Binciken jiki nan take',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'Kada ka je kai kadai',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'Duba na likita cikin gaggawa',
            [COMMON_TEXT_KEYS.physicalTests]: 'Ana iya bukatar gwaje-gwaje',
            [COMMON_TEXT_KEYS.monitorProgression]: 'Ci gaba da sa ido',
            [COMMON_TEXT_KEYS.symptomNotes]: 'Rubuta bayanin alamomi cikin tsaro',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'Tallafin shan ruwa',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'Kulawar haihuwa tare da jagorancin kwararre',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'Kada ka yi amfani da kwayoyi marasa tabbaci',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'Alamun gaggawa',
            [COMMON_TEXT_KEYS.emergencyAction]: 'Nemi kulawar gaggawa nan da nan ko kira ma aikatan agajin gaggawa na yankinku yanzu.',
            [COMMON_TEXT_KEYS.examAction]: 'Je asibiti don a yi binciken jiki cikin gaggawa, a duba muhimman alamu da kuma gwaje-gwajen da likita ya tsara kamar ECG, dakin gwaje-gwaje, hoton ciki ko duba iskar oxygen.',
            [COMMON_TEXT_KEYS.transportAction]: 'Idan kana jin zaka suma, ka rikice ko ba za ka iya numfashi yadda ya kamata ba, ka nemi taimako nan take.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'Ka shirya duba na likita kai tsaye a rana guda cikin sauri sosai.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'Likita ko cibiyar gaggawa na iya bukatar su duba ka su yanke shawara kan gwaje-gwaje kamar jini, swab, hoton ciki ko wasu bincike bisa ga alamominka.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'Ci gaba da shan ruwa idan kana iya dauka yayin da kake neman kulawa, sannan ka tsaya idan hadiyewa ko numfashi ya kara wahala.',
            [COMMON_TEXT_KEYS.monitorAction]: 'Ka lura da karin ciwo, canjin numfashi, rudani ko kasa rike ruwa a ciki.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'Rubuta lokacin da alamomi suka fara, tsananinsu da duk wani magani da ka riga ka sha domin likita ya gani.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'Wannan bukata tana bukatar kwararre mai lasisi ko sabis na lafiyar haihuwa don tabbatar da matsayin ciki, tattauna zabin da kuma yanke hukunci ko zubar da ciki ta magani ya dace.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'Kada ka fara amfani da kwayoyin zubar da ciki da ba a sani ko tabbatar da su ba ba tare da duba na kwararre ba, domin wajen da ciki yake, lokaci, contraindications da bin diddigi suna da muhimmanci.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'Nemi taimakon asibiti cikin gaggawa idan akwai zubar jini mai yawa, sumewa, matsanancin ciwon ciki, zazzabi ko kara muni na rauni.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'Sashen gaggawa',
            [COMMON_TEXT_KEYS.urgentCare]: 'Kulawar gaggawa',
            [COMMON_TEXT_KEYS.primaryCare]: 'Kulawar farko',
            [COMMON_TEXT_KEYS.homeCare]: 'Kulawa a gida',
            [COMMON_TEXT_KEYS.womensHealth]: 'Asibitin lafiyar mata',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'Je nan da nan asibiti ko sashen gaggawa don a duba ka kuma a yi gwaje-gwaje cikin gaggawa.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'Nemi duba cikin gaggawa yau daga likita ko asibiti domin binciken jiki da karin gwaje-gwaje idan ana bukata.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'Ka shirya bibiyar lafiya nan ba da jimawa ba kuma ka kara neman taimako idan alamomi suka tsananta.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'Ci gaba da sa ido a gida sannan ka shirya kulawar yau da kullum idan alamomin suka ci gaba.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'Ka shirya a duba ka da sauri a wajen likitan mata, cibiyar lafiyar haihuwa ko kwararren likita domin tabbatar da ciki, tattauna zabin da kuma samun bin diddigi cikin tsaro.'
        }
    },
    Arabic: {
        nativeNames: { English: 'الانجليزية', Arabic: 'العربية' },
        riskLabels: { LOW: 'منخفض', MODERATE: 'متوسط', HIGH: 'مرتفع', EMERGENCY: 'طارئ' },
        templates: {
            concernIntro: 'القلق الرئيسي هو',
            concernBridge: 'استنادا إلى المعلومات المتاحة،',
            safeGuidanceIntro: 'خطوات آمنة مقترحة',
            referralPrefix: 'أفضل خطوة تالية',
            final: {
                LOW: 'يبدو هذا منخفض الخطورة حاليا. استخدم خطوات العناية الذاتية الأساسية واطلب مراجعة طبية إذا ساءت الأعراض أو لم تتحسن.',
                MODERATE: 'يبدو أن هذا يحتاج إلى مراجعة طبية قريبا. راقب الحالة عن قرب ورتب زيارة طبية إذا لم تتحسن أو ظهرت أعراض جديدة.',
                HIGH: 'يبدو أن هذا أمر خطير ويحتاج إلى مراجعة طبية عاجلة اليوم. لا تؤخر التقييم الحضوري.',
                EMERGENCY: 'قد تكون هذه حالة طارئة. اطلب رعاية طارئة فورا أو اتصل بخدمات الطوارئ المحلية الآن.'
            }
        },
        detectors: [/الم/, /صدر/, /حمى/, /تنفس/, /نزيف/, /اغماء/, /انتحار/],
        replacements: [[/الم في الصدر/g, 'chest pain'], [/ضيق في التنفس/g, 'shortness of breath'], [/صعوبة في التنفس/g, 'difficulty breathing'], [/صداع/g, 'headache'], [/حمى شديدة/g, 'high fever'], [/حمى/g, 'fever'], [/قيء/g, 'vomiting'], [/غثيان/g, 'nausea'], [/دوخة/g, 'dizziness'], [/سعال/g, 'cough'], [/نزيف/g, 'bleeding'], [/اغماء/g, 'fainting'], [/اجهاض/g, 'abortion'], [/انتحار/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'تشير علامات الخطر إلى حالة قد تكون حرجة زمنيا وتحتاج إلى تقييم طارئ.',
            [COMMON_TEXT_KEYS.urgentReason]: 'يشير نمط الأعراض إلى أن التقييم الطبي العاجل حضوريا مناسب اليوم.',
            [COMMON_TEXT_KEYS.mediumReason]: 'تبدو الأعراض مهمة طبيا لكنها لا تشير مباشرة من المعلومات المتاحة إلى طارئ يهدد الحياة.',
            [COMMON_TEXT_KEYS.lowReason]: 'لم تظهر علامات خطر فورية من الوصف المحدود، لكن قد تظل المراقبة والمتابعة الروتينية مطلوبة.',
            [COMMON_TEXT_KEYS.abortionReason]: 'هذه طلب مباشر يتعلق برعاية الصحة الإنجابية ويحتاج إلى مراجعة سريرية للتأكد من الحالة ومناقشة الخيارات والحفاظ على السلامة.',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'القلق المتعلق بإنهاء الحمل مع وجود علامات تحذيرية محتملة يحتاج إلى تقييم عاجل حضوريا في رعاية الصحة الإنجابية أو الطوارئ.',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'تصعيد إلى الطوارئ',
            [COMMON_TEXT_KEYS.immediateExam]: 'فحص بدني فوري',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'لا تذهب وحدك',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'تقييم سريري عاجل',
            [COMMON_TEXT_KEYS.physicalTests]: 'قد تكون الفحوصات مطلوبة',
            [COMMON_TEXT_KEYS.monitorProgression]: 'راقب تطور الحالة',
            [COMMON_TEXT_KEYS.symptomNotes]: 'دوّن ملاحظات آمنة عن الأعراض',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'دعم الترطيب',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'رعاية إنجابية بإشراف مختص',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'لا تستخدم أقراصا غير موثقة',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'علامات تحذير طارئة',
            [COMMON_TEXT_KEYS.emergencyAction]: 'اطلب رعاية طارئة فورا أو اتصل بخدمات الطوارئ المحلية الآن.',
            [COMMON_TEXT_KEYS.examAction]: 'اذهب إلى المستشفى لإجراء فحص بدني عاجل وقياس العلامات الحيوية وفحوصات يحددها الطبيب مثل تخطيط القلب أو التحاليل أو التصوير أو تقييم الأكسجين حسب الحاجة.',
            [COMMON_TEXT_KEYS.transportAction]: 'إذا شعرت بأنك ستفقد الوعي أو كنت مشوشا أو غير قادر على التنفس بشكل طبيعي فاطلب المساعدة فورا.',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'رتب تقييما طبيا حضوريا في اليوم نفسه بأسرع ما يمكن.',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'قد يحتاج الطبيب أو مركز الرعاية العاجلة إلى فحصك وتحديد الفحوصات مثل تحاليل الدم أو المسحات أو التصوير أو فحوصات أخرى بحسب الأعراض.',
            [COMMON_TEXT_KEYS.hydrationAction]: 'استمر في شرب السوائل إذا كنت تستطيع تحملها أثناء ترتيب الرعاية وتوقف إذا أصبح البلع أو التنفس أصعب.',
            [COMMON_TEXT_KEYS.monitorAction]: 'راقب ازدياد الألم أو تغيرات التنفس أو التشوش أو عدم القدرة على الاحتفاظ بالسوائل.',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'دوّن وقت بدء الأعراض وشدتها وأي أدوية تم تناولها بالفعل لمراجعتها مع الطبيب.',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'يحتاج هذا الطلب إلى مختص مرخص أو خدمة صحة إنجابية لتأكيد حالة الحمل ومناقشة الخيارات وتحديد ما إذا كان الإجهاض الدوائي مناسبا.',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'لا تبدأ باستخدام حبوب إجهاض غير معروفة أو غير موثقة دون مراجعة مهنية لأن مكان الحمل والتوقيت والموانع والمتابعة أمور مهمة.',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'اطلب رعاية مستعجلة فورا إذا كان هناك نزيف شديد أو إغماء أو ألم بطني شديد أو حمى أو ضعف يزداد.',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'قسم الطوارئ',
            [COMMON_TEXT_KEYS.urgentCare]: 'رعاية عاجلة',
            [COMMON_TEXT_KEYS.primaryCare]: 'رعاية أولية',
            [COMMON_TEXT_KEYS.homeCare]: 'رعاية منزلية',
            [COMMON_TEXT_KEYS.womensHealth]: 'عيادة صحة المرأة',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'اذهب فورا إلى مستشفى أو قسم طوارئ لإجراء فحص بدني وفحوصات عاجلة.',
            [COMMON_TEXT_KEYS.highReferralAction]: 'اطلب اليوم تقييما عاجلا من طبيب أو مستشفى لإجراء فحص بدني وفحوصات إضافية إذا لزم الأمر.',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'رتب متابعة سريرية قريبة واطلب مستوى أعلى من الرعاية إذا ساءت الأعراض.',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'استمر في المراقبة المنزلية ورتب متابعة روتينية إذا استمرت الأعراض.',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'رتب بسرعة مراجعة مع طبيب نساء مرخص أو عيادة صحة إنجابية أو طبيب مؤهل لتأكيد الحمل ومناقشة الخيارات والمتابعة الآمنة.'
        }
    },
    Hindi: {
        nativeNames: { English: 'अंग्रेज़ी', Hindi: 'हिंदी' },
        riskLabels: { LOW: 'कम', MODERATE: 'मध्यम', HIGH: 'उच्च', EMERGENCY: 'आपातकाल' },
        templates: {
            concernIntro: 'मुख्य चिंता यह है',
            concernBridge: 'उपलब्ध जानकारी के आधार पर,',
            safeGuidanceIntro: 'सुरक्षित सुझाए गए कदम',
            referralPrefix: 'अगला सबसे अच्छा कदम',
            final: {
                LOW: 'अभी यह कम जोखिम वाला लगता है। बुनियादी स्वयं देखभाल करें और यदि लक्षण बिगड़ें या ठीक न हों तो डॉक्टर से जांच कराएं।',
                MODERATE: 'यह जल्द चिकित्सा समीक्षा की जरूरत जैसा लगता है। स्थिति पर नजर रखें और यदि सुधार न हो या नए लक्षण आएं तो डॉक्टर से मिलें।',
                HIGH: 'यह गंभीर लगता है और आज ही त्वरित चिकित्सा समीक्षा की जरूरत है। आमने-सामने जांच में देरी न करें।',
                EMERGENCY: 'यह आपातकाल हो सकता है। तुरंत आपातकालीन चिकित्सा सहायता लें या अभी स्थानीय आपातकालीन सेवाओं को कॉल करें।'
            }
        },
        detectors: [/सीने/, /दर्द/, /बुखार/, /सांस/, /खून/, /बेहोश/, /आत्महत्या/],
        replacements: [[/सीने में दर्द/g, 'chest pain'], [/सांस फूलना/g, 'shortness of breath'], [/सांस लेने में कठिनाई/g, 'difficulty breathing'], [/सिरदर्द/g, 'headache'], [/तेज बुखार/g, 'high fever'], [/बुखार/g, 'fever'], [/उल्टी/g, 'vomiting'], [/मतली/g, 'nausea'], [/चक्कर/g, 'dizziness'], [/खांसी/g, 'cough'], [/खून बहना/g, 'bleeding'], [/बेहोश/g, 'fainting'], [/गर्भपात/g, 'abortion'], [/आत्महत्या/g, 'suicide']],
        text: {
            [COMMON_TEXT_KEYS.emergencyReason]: 'चेतावनी वाले लक्षण ऐसे हालात की ओर इशारा करते हैं जिन्हें तुरंत आपातकालीन जांच की जरूरत हो सकती है।',
            [COMMON_TEXT_KEYS.urgentReason]: 'लक्षणों का पैटर्न बताता है कि आज ही आमने-सामने त्वरित चिकित्सा जांच उचित है।',
            [COMMON_TEXT_KEYS.mediumReason]: 'लक्षण चिकित्सकीय रूप से महत्वपूर्ण लगते हैं, लेकिन उपलब्ध जानकारी के आधार पर तुरंत जानलेवा आपातकाल का संकेत नहीं देते।',
            [COMMON_TEXT_KEYS.lowReason]: 'सीमित विवरण में कोई तुरंत चेतावनी संकेत नहीं मिले, लेकिन निगरानी और नियमित फॉलो-अप फिर भी जरूरी हो सकता है।',
            [COMMON_TEXT_KEYS.abortionReason]: 'यह प्रजनन स्वास्थ्य देखभाल से जुड़ा सीधा अनुरोध है और स्थिति की पुष्टि, विकल्पों पर चर्चा और सुरक्षा के लिए चिकित्सकीय समीक्षा की जरूरत है।',
            [COMMON_TEXT_KEYS.abortionHighReason]: 'गर्भसमापन से जुड़ी चिंता और संभावित चेतावनी संकेत होने पर प्रजनन स्वास्थ्य सेवा या आपातकाल में तुरंत आमने-सामने जांच की जरूरत है।',
            [COMMON_TEXT_KEYS.emergencyEscalation]: 'आपातकालीन सलाह',
            [COMMON_TEXT_KEYS.immediateExam]: 'तुरंत शारीरिक जांच',
            [COMMON_TEXT_KEYS.doNotTravelAlone]: 'अकेले यात्रा न करें',
            [COMMON_TEXT_KEYS.urgentEvaluation]: 'त्वरित चिकित्सकीय जांच',
            [COMMON_TEXT_KEYS.physicalTests]: 'जांचें आवश्यक हो सकती हैं',
            [COMMON_TEXT_KEYS.monitorProgression]: 'स्थिति पर नजर रखें',
            [COMMON_TEXT_KEYS.symptomNotes]: 'लक्षणों के नोट सुरक्षित रखें',
            [COMMON_TEXT_KEYS.hydrationSupport]: 'पानी और तरल का सहारा',
            [COMMON_TEXT_KEYS.clinicianGuidedCare]: 'विशेषज्ञ मार्गदर्शन वाली प्रजनन देखभाल',
            [COMMON_TEXT_KEYS.avoidUnverified]: 'अप्रमाणित गोलियां न लें',
            [COMMON_TEXT_KEYS.emergencyWarningSigns]: 'आपातकालीन चेतावनी संकेत',
            [COMMON_TEXT_KEYS.emergencyAction]: 'तुरंत आपातकालीन चिकित्सा सहायता लें या अभी स्थानीय आपातकालीन सेवाओं को कॉल करें।',
            [COMMON_TEXT_KEYS.examAction]: 'अस्पताल जाएं ताकि तुरंत शारीरिक जांच, जीवन संकेतों की जांच और डॉक्टर द्वारा तय परीक्षण जैसे ईसीजी, लैब जांच, इमेजिंग या ऑक्सीजन मूल्यांकन हो सके।',
            [COMMON_TEXT_KEYS.transportAction]: 'यदि आपको बेहोशी जैसा लगे, भ्रम हो या सामान्य रूप से सांस न ले पा रहे हों तो तुरंत मदद लें।',
            [COMMON_TEXT_KEYS.urgentEvalAction]: 'जितनी जल्दी हो सके उसी दिन आमने-सामने चिकित्सा जांच की व्यवस्था करें।',
            [COMMON_TEXT_KEYS.physicalTestsAction]: 'डॉक्टर या अर्जेंट केयर केंद्र को आपकी जांच करके खून की जांच, स्वैब, इमेजिंग या अन्य परीक्षणों का निर्णय लेना पड़ सकता है।',
            [COMMON_TEXT_KEYS.hydrationAction]: 'यदि आप सहन कर पा रहे हों तो देखभाल की व्यवस्था करते समय तरल लेते रहें, और यदि निगलना या सांस लेना कठिन हो जाए तो रुक जाएं।',
            [COMMON_TEXT_KEYS.monitorAction]: 'दर्द बढ़ना, सांस में बदलाव, भ्रम या तरल रोक न पाना जैसी बातों पर नजर रखें।',
            [COMMON_TEXT_KEYS.symptomNotesAction]: 'लक्षण कब शुरू हुए, कितने गंभीर हैं और कौन सी दवाएं पहले ही ली जा चुकी हैं यह डॉक्टर को दिखाने के लिए लिख लें।',
            [COMMON_TEXT_KEYS.clinicianGuidedAction]: 'इस अनुरोध के लिए लाइसेंसधारी चिकित्सक या प्रजनन स्वास्थ्य सेवा की जरूरत है ताकि गर्भ की स्थिति की पुष्टि हो, विकल्पों पर चर्चा हो और यह तय हो सके कि दवा से गर्भसमापन उचित है या नहीं।',
            [COMMON_TEXT_KEYS.avoidUnverifiedAction]: 'बिना पेशेवर समीक्षा के अनजान या अप्रमाणित गर्भपात की गोलियां शुरू न करें, क्योंकि गर्भ का स्थान, समय, निषेध और फॉलो-अप महत्वपूर्ण हैं।',
            [COMMON_TEXT_KEYS.emergencyWarningAction]: 'यदि बहुत ज्यादा खून बहे, बेहोशी हो, पेट में तेज दर्द हो, बुखार हो या कमजोरी बढ़े तो तुरंत अस्पताल जाएं।',
            [COMMON_TEXT_KEYS.emergencyRoom]: 'आपातकालीन कक्ष',
            [COMMON_TEXT_KEYS.urgentCare]: 'त्वरित देखभाल',
            [COMMON_TEXT_KEYS.primaryCare]: 'प्राथमिक देखभाल',
            [COMMON_TEXT_KEYS.homeCare]: 'घर पर देखभाल',
            [COMMON_TEXT_KEYS.womensHealth]: 'महिला स्वास्थ्य क्लिनिक',
            [COMMON_TEXT_KEYS.emergencyReferralAction]: 'तुरंत अस्पताल या आपातकालीन विभाग जाएं ताकि शारीरिक जांच और जरूरी परीक्षण हो सकें।',
            [COMMON_TEXT_KEYS.highReferralAction]: 'आज ही डॉक्टर या अस्पताल से त्वरित जांच कराएं ताकि शारीरिक परीक्षण और जरूरत पड़ने पर आगे की जांच हो सके।',
            [COMMON_TEXT_KEYS.mediumReferralAction]: 'जल्द क्लिनिकल फॉलो-अप तय करें और लक्षण बिगड़ने पर उच्च स्तर की देखभाल लें।',
            [COMMON_TEXT_KEYS.lowReferralAction]: 'घर पर निगरानी रखें और लक्षण बने रहने पर नियमित फॉलो-अप कराएं।',
            [COMMON_TEXT_KEYS.abortionReferralAction]: 'गर्भ की पुष्टि, विकल्पों पर सलाह और सुरक्षित फॉलो-अप के लिए लाइसेंसधारी स्त्रीरोग विशेषज्ञ, प्रजनन स्वास्थ्य क्लिनिक या योग्य डॉक्टर से जल्दी समीक्षा कराएं।'
        }
    }
};

function normalizeInput(text = '') {
    return text.replace(/\s+/g, ' ').trim();
}

function stripDiacritics(text = '') {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeForMatching(text = '') {
    return stripDiacritics(text.toLowerCase());
}

function detectLanguage(text = '') {
    const sample = normalizeForMatching(text);
    let bestLanguage = 'English';
    let bestScore = 0;

    Object.entries(LANGUAGE_PACKS).forEach(([language, pack]) => {
        const score = (pack.detectors || []).reduce((count, pattern) => count + (pattern.test(sample) ? 1 : 0), 0);
        if (score > bestScore) {
            bestScore = score;
            bestLanguage = language;
        }
    });

    return bestLanguage;
}

function translateSymptomTextToEnglish(text = '', language = 'English') {
    const pack = LANGUAGE_PACKS[language];
    if (!pack) {
        return normalizeInput(text);
    }

    const normalized = normalizeForMatching(text);
    return normalizeInput((pack.replacements || []).reduce((currentText, [pattern, replacement]) => currentText.replace(pattern, replacement), normalized));
}

function urgencyToRiskCode(urgency = 'LOW') {
    if (urgency === 'CRITICAL') return 'EMERGENCY';
    if (urgency === 'HIGH') return 'HIGH';
    if (urgency === 'MEDIUM') return 'MODERATE';
    return 'LOW';
}

function getLocalizedRiskLevel(urgency = 'LOW', language = 'English') {
    const code = urgencyToRiskCode(urgency);
    const labels = LANGUAGE_PACKS[language]?.riskLabels || ENGLISH_LABELS;
    return { code, label: labels[code] || labels.MODERATE };
}

function getLocalizedLanguageName(languageName = 'English', targetLanguage = 'English') {
    return LANGUAGE_PACKS[targetLanguage]?.nativeNames?.[languageName] || languageName;
}

function getLocalizedTemplates(language = 'English') {
    return LANGUAGE_PACKS[language]?.templates || ENGLISH_TEMPLATES;
}

function translateKnownText(text = '', language = 'English') {
    return LANGUAGE_PACKS[language]?.text?.[text] || text;
}

module.exports = {
    COMMON_TEXT_KEYS,
    detectLanguage,
    getLocalizedLanguageName,
    getLocalizedRiskLevel,
    getLocalizedTemplates,
    normalizeForMatching,
    translateKnownText,
    translateSymptomTextToEnglish,
    urgencyToRiskCode
};
