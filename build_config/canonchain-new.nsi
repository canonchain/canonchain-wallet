; �ýű�ʹ�� HM VNISEdit �ű��༭���򵼲���

; ��װ�����ʼ���峣��
!define PRODUCT_NAME "CanonChain Wallet"
!define PRODUCT_VERSION "1.0.6"
!define PRODUCT_PUBLISHER "Canonchain"
!define PRODUCT_WEB_SITE "http://www.canonchain.com"

SetCompressor lzma

; ------ MUI �ִ����涨�� (1.67 �汾���ϼ���) ------
!include "MUI.nsh"

; MUI Ԥ���峣��
!define MUI_ABORTWARNING
!define MUI_ICON "canonchain.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; ��װ����ҳ��
!insertmacro MUI_PAGE_INSTFILES

; ��װж�ع���ҳ��
!insertmacro MUI_UNPAGE_INSTFILES

; ��װ���ҳ��
!insertmacro MUI_PAGE_FINISH

; ��װ�����������������
!insertmacro MUI_LANGUAGE "SimpChinese"

; ------ MUI �ִ����涨����� ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
InstallDir "$LOCALAPPDATA\Programs\Canonchain Wallet"
OutFile "..\build\CanonChain-Wallet-Setup.exe"
Icon "canonchain.ico"
UninstallIcon "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
ShowInstDetails show
ShowUnInstDetails show
BrandingText "CanonChain Wallet"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on
  File /r  /x d3dcompiler_47.dll "..\build\win-unpacked\*.*"
  SetOutPath "$INSTDIR\assets"
  File ..\vc15\vc_redist.x64.exe
  CreateShortCut "$DESKTOP\CanonChain-Wallet.lnk" "$INSTDIR\CanonChain Wallet.exe"
SectionEnd

Section -AdditionalIcons
  WriteIniStr "$INSTDIR\${PRODUCT_NAME}.url" "InternetShortcut" "URL" "${PRODUCT_WEB_SITE}"
  CreateDirectory "$SMPROGRAMS\CanonChain-Wallet"
  CreateShortCut "$SMPROGRAMS\CanonChain-Wallet\CanonChain-Wallet.lnk" "$INSTDIR\CanonChain Wallet.exe"
  CreateShortCut "$SMPROGRAMS\CanonChain-Wallet\Uninstall.lnk" "$INSTDIR\uninst.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

#-- ���� NSIS �ű��༭�������� Function ���α�������� Section ����֮���д���Ա��ⰲװ�������δ��Ԥ֪�����⡣--#

Function .onInit
  !insertmacro MUI_LANGDLL_DISPLAY
FunctionEnd

/******************************
 *  �����ǰ�װ�����ж�ز���  *
 ******************************/

Section Uninstall
  Delete "$INSTDIR\${PRODUCT_NAME}.url"
  Delete "$INSTDIR\uninst.exe"

  Delete "$SMPROGRAMS\CanonChain-Wallet\CanonChain-Wallet.lnk"
  Delete "$SMPROGRAMS\CanonChain-Wallet\Uninstall.lnk"
  Delete "$DESKTOP\CanonChain-Wallet.lnk"

  RMDir "$SMPROGRAMS\CanonChain-Wallet"

  RMDir /r "$INSTDIR\swiftshader"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"

  RMDir /r "$INSTDIR"

  SetAutoClose true
SectionEnd

#-- ���� NSIS �ű��༭�������� Function ���α�������� Section ����֮���д���Ա��ⰲװ�������δ��Ԥ֪�����⡣--#

Function un.onInit
!insertmacro MUI_UNGETLANGUAGE
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "��ȷʵҪ��ȫ�Ƴ� $(^Name) ���������е������" IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) �ѳɹ��ش����ļ�����Ƴ���"
FunctionEnd