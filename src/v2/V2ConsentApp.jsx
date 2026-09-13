import React, { useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getDocument } from '../documents';
import { db, storage } from '../firebase';
import { composeRecordImage } from './composeRecordImage';
import { buildPrintHtml, openPrintWindow } from './printDocument';
import {
  allSlidesChecked,
  createDocumentSession,
  createInitialSession,
  ensureDocumentSession,
  visibleSlides,
} from './session';
import ConfirmScreen from './screens/ConfirmScreen';
import FinalConfirmScreen from './screens/FinalConfirmScreen';
import SignatureScreen from './screens/SignatureScreen';
import SlideshowScreen from './screens/SlideshowScreen';
import StartScreen from './screens/StartScreen';

function dataUrlToBlob(dataUrl) {
  const [header, body] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(header)?.[1] || 'image/png';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function V2ConsentApp() {
  const [step, setStep] = useState('start');
  const [slideIndex, setSlideIndex] = useState(0);
  const [session, setSession] = useState(createInitialSession);
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const documentId = session.selectedDocumentIds[0] || 'ippan_shujutsu';
  const documentDef = useMemo(() => getDocument(documentId), [documentId]);
  const documentSession = ensureDocumentSession(session, documentId);
  const slides = useMemo(() => visibleSlides(documentDef, session), [documentDef, session]);

  const updateDocumentSession = (nextDocumentSession) => {
    const others = (session.documentSessions || []).filter((item) => item.documentId !== documentId);
    setSession({
      ...session,
      documentSessions: [...others, nextDocumentSession],
    });
  };

  const handleStartNext = () => {
    if (!session.ownerName.trim() || !session.petName.trim() || !session.date) {
      setNotice('飼い主氏名・動物の名前・日付を入力してください。');
      return;
    }
    if (!session.selectedDocumentIds.length) {
      setNotice('書類を選択してください。');
      return;
    }
    if (documentDef.procedureOptions?.length) {
      const selection = session.procedureSelections[documentId];
      if (!selection?.selected?.length) {
        setNotice('手術・処置の内容を選択してください。');
        return;
      }
    }
    setNotice('');
    if (!(session.documentSessions || []).some((item) => item.documentId === documentId)) {
      updateDocumentSession(createDocumentSession(documentId));
    }
    setSlideIndex(0);
    setStep('confirm');
  };

  const handleToggleCheck = (slideId, checked) => {
    const timestamps = { ...(documentSession.slideCheckTimestamps || {}) };
    if (checked) timestamps[slideId] = new Date().toISOString();
    else delete timestamps[slideId];
    updateDocumentSession({ ...documentSession, slideCheckTimestamps: timestamps });
  };

  const handleSlideNext = () => {
    if (slideIndex < slides.length - 1) {
      setNotice('');
      setSlideIndex(slideIndex + 1);
      return;
    }
    if (!allSlidesChecked(documentDef, documentSession, session)) {
      setNotice('すべてのスライドで「理解しました」にチェックを入れてから署名へ進んでください。');
      return;
    }
    setNotice('');
    setStep('signature');
  };

  const handleSigned = (dataUrl) => {
    updateDocumentSession({
      ...documentSession,
      signatureDataUrl: dataUrl,
      signedAt: new Date().toISOString(),
    });
    setStep('final');
  };

  const handleSaveAndPrint = async () => {
    if (!allSlidesChecked(documentDef, documentSession, session) || !documentSession.signatureDataUrl) {
      setNotice('署名とスライド確認がそろっていません。');
      return;
    }
    if (!documentSession.explainerStaff || !documentSession.scheduleEntryStaff || !documentSession.scheduleEntryChecked) {
      setNotice('最終確認の項目をすべて入力してください。');
      return;
    }

    setIsSaving(true);
    setNotice('');
    try {
      const recordImageDataUrl = await composeRecordImage({
        ownerName: session.ownerName,
        petName: session.petName,
        date: session.date,
        visitTime: session.visitTime,
        documentLabel: documentDef.label,
        slides,
        slideCheckTimestamps: documentSession.slideCheckTimestamps,
        signatureDataUrl: documentSession.signatureDataUrl,
        explainerStaff: documentSession.explainerStaff,
        scheduleEntryStaff: documentSession.scheduleEntryStaff,
      });

      const now = new Date();
      const printedAt = now.toISOString();
      const yearMonth = (session.date || now.toISOString()).slice(0, 7);
      const stamp = `${yearMonth}/${now.getTime()}_${documentDef.id}`;
      const signaturePath = `consents/${stamp}_signature.png`;
      const recordPath = `consents/${stamp}_record.png`;

      await uploadBytes(ref(storage, signaturePath), dataUrlToBlob(documentSession.signatureDataUrl));
      await uploadBytes(ref(storage, recordPath), dataUrlToBlob(recordImageDataUrl));
      const [signatureUrl, recordImageUrl] = await Promise.all([
        getDownloadURL(ref(storage, signaturePath)),
        getDownloadURL(ref(storage, recordPath)),
      ]);

      await addDoc(collection(db, 'consents'), {
        schemaVersion: 2,
        formTypeId: documentDef.id,
        category: documentDef.category,
        ownerName: session.ownerName,
        petName: session.petName,
        date: session.date,
        visitTime: session.visitTime,
        foodPortions: session.foodPortions,
        phone: session.phone,
        emergencyContact: session.emergencyContact,
        procedureSelection: session.procedureSelections[documentDef.id] || null,
        requiresFasting: Boolean(session.requiresFasting),
        slideVersion: documentDef.slideVersion,
        slideCheckTimestamps: documentSession.slideCheckTimestamps,
        signedAt: documentSession.signedAt,
        explainerStaff: documentSession.explainerStaff,
        scheduleEntryStaff: documentSession.scheduleEntryStaff,
        scheduleEntryChecked: documentSession.scheduleEntryChecked,
        printedAt: [printedAt],
        yearMonth,
        signaturePath,
        signatureUrl,
        recordImagePath: recordPath,
        recordImageUrl,
        createdAt: serverTimestamp(),
      });

      const html = buildPrintHtml({
        session,
        documentDef,
        documentSession: { ...documentSession, printedAt: [printedAt] },
        recordImageDataUrl,
      });
      const opened = openPrintWindow(html);
      setNotice(opened ? '保存しました。印刷ダイアログを確認してください。' : '保存しました。印刷用ウィンドウを開けませんでした。');
      setSession(createInitialSession());
      setStep('start');
    } catch (error) {
      console.error('v2保存エラー:', error);
      setNotice(`保存に失敗しました。${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'start') {
    return (
      <StartScreen
        session={session}
        onChange={setSession}
        onNext={handleStartNext}
        notice={notice}
      />
    );
  }

  if (step === 'confirm') {
    return (
      <ConfirmScreen
        session={session}
        documentDef={documentDef}
        onBack={() => setStep('start')}
        onNext={() => setStep('slideshow')}
      />
    );
  }

  if (step === 'slideshow') {
    return (
      <SlideshowScreen
        documentDef={documentDef}
        documentSession={documentSession}
        session={session}
        slides={slides}
        slideIndex={slideIndex}
        onToggleCheck={handleToggleCheck}
        onBack={() => {
          setNotice('');
          if (slideIndex === 0) setStep('confirm');
          else setSlideIndex(slideIndex - 1);
        }}
        onNext={handleSlideNext}
        notice={notice}
      />
    );
  }

  if (step === 'signature') {
    return (
      <SignatureScreen
        session={session}
        onChange={setSession}
        documentDef={documentDef}
        documentSession={documentSession}
        onBack={() => {
          setSlideIndex(Math.max(slides.length - 1, 0));
          setStep('slideshow');
        }}
        onNext={handleSigned}
        onClearSignature={() => updateDocumentSession({
          ...documentSession,
          signatureDataUrl: null,
          signedAt: null,
        })}
      />
    );
  }

  return (
    <FinalConfirmScreen
      documentSession={documentSession}
      onChangeDocumentSession={updateDocumentSession}
      onBack={() => setStep('signature')}
      onSave={handleSaveAndPrint}
      isSaving={isSaving}
      notice={notice}
    />
  );
}
