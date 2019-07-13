; 该脚本使用 HM VNISEdit 脚本编辑器向导产生

; 安装程序初始定义常量
!define PRODUCT_NAME "CanonChain Wallet"
!define PRODUCT_VERSION "1.0.3"
!define PRODUCT_PUBLISHER "Canonchain"
!define PRODUCT_WEB_SITE "http://www.canonchain.com"

SetCompressor lzma

; ------ MUI 现代界面定义 (1.67 版本以上兼容) ------
!include "MUI.nsh"

; MUI 预定义常量
!define MUI_ABORTWARNING
!define MUI_ICON "canonchain.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; 安装过程页面
!insertmacro MUI_PAGE_INSTFILES

; 安装卸载过程页面
!insertmacro MUI_UNPAGE_INSTFILES

; 安装完成页面
!insertmacro MUI_PAGE_FINISH

; 安装界面包含的语言设置
!insertmacro MUI_LANGUAGE "SimpChinese"

; ------ MUI 现代界面定义结束 ------

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
  CreateShortCut "$SMPROGRAMS\CanonChain-Wallet\Website.lnk" "$INSTDIR\${PRODUCT_NAME}.url"
  CreateShortCut "$SMPROGRAMS\CanonChain-Wallet\Uninstall.lnk" "$INSTDIR\uninst.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

#-- 根据 NSIS 脚本编辑规则，所有 Function 区段必须放置在 Section 区段之后编写，以避免安装程序出现未可预知的问题。--#

Function .onInit
  !insertmacro MUI_LANGDLL_DISPLAY
FunctionEnd

/******************************
 *  以下是安装程序的卸载部分  *
 ******************************/

Section Uninstall
  Delete "$INSTDIR\${PRODUCT_NAME}.url"
  Delete "$INSTDIR\uninst.exe"

  Delete "$SMPROGRAMS\CanonChain-Wallet\Uninstall.lnk"
  Delete "$SMPROGRAMS\CanonChain-Wallet\Website.lnk"
  Delete "$DESKTOP\CanonChain-Wallet.lnk"

  RMDir "$SMPROGRAMS\CanonChain-Wallet"

  RMDir /r "$INSTDIR\swiftshader"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"

  RMDir "$INSTDIR"

  SetAutoClose true
SectionEnd

#-- 根据 NSIS 脚本编辑规则，所有 Function 区段必须放置在 Section 区段之后编写，以避免安装程序出现未可预知的问题。--#

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "您确实要完全移除 $(^Name) ，及其所有的组件？" IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) 已成功地从您的计算机移除。"
FunctionEnd