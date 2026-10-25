;;; maak.scm --- Nyctibius build automation, ported from Make to maak
;;; -*- mode: scheme; -*-
;;; SPDX-License-Identifier: GPL-3.0-or-later
;;; Copyright © 2026 Urutau-Ltd <softwarelibre@urutau-ltd.org>
;;;
;;;   , _ ,      _    _            _                     _ _      _
;;;  ( o o )    | |  | |          | |                   | | |    | |
;;; /'` ' `'\   | |  | |_ __ _   _| |_ __ _ _   _ ______| | |_ __| |
;;; |'''''''|   | |  | | '__| | | | __/ _` | | | |______| | __/ _` |
;;; |\\'''//|   | |__| | |  | |_| | || (_| | |_| |      | | || (_| |
;;;    """       \____/|_|   \__,_|\__\__,_|\__,_|      |_|\__\__,_|
;;;
;;; This program is free software: you can redistribute it and/or modify
;;; it under the terms of the  GNU General Public License as published by
;;; the Free Software Foundation, either version 3 of the License, or (at
;;; your option) any later version.
;;;
;;; This program is distributed in the hope that it will be useful, but
;;; WITHOUT ANY WARRANTY; without even the implied warranty of
;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
;;; See the GNU General Public License for more details.
;;;
;;; You should have received a copy of the GNU General Public License
;;; along with this program. If not, see <https://www.gnu.org/licenses/>.
;;;
;;; Commentary:
;;;
;;; EXPERIMENTAL maak support for this repository.
;;;
;;; The top-level Makefile and the build-system/ directory remain
;;; authoritative; this file is a best-effort port of their targets to maak
;;; (codeberg.org/jjba23/maak). Run it with `maak`, list tasks with
;;; `maak --list`, and test without side effects with `maak -n -- <tasks>`.
;;;
;;; Ported files:
;;;   Makefile (top-level), Makefile.container, Makefile.dev,
;;;   Makefile.fmt, Makefile.lint
;;;
;;; NOTE - EVERYTHING MUST BE SELF-CONTAINED IN THIS FILE. DO NOT ADD ANY
;;; IMPORTS OUTSIDE ICE-9 AND MAAK. THIS FILE SHOULD NOT BE SPLIT INTO
;;; MODULES BECAUSE IT WOULD BE A MESS TO CHANGE THE GUILE LOAD PATH
;;; AGAIN!
;;;
;;; Code:
(define-module (maak)
    #:declarative? #t
    #:use-module (maak maak))

(define %image-tag
    "sl.urutau-ltd.org/urutau-ltd/urutau-ltd:latest")

(define %deno-dir
    (string-append (getenv "HOME") "/.deno/bin"))

(define (default)
    "List the available tasks."
    (list-tasks))

(define (help)
    "Show this task list."
    (list-tasks))

(define (env)
    "Enter the Guix development shell for this channel."
    ($ (list "guix" "shell" "--emulate-fhs" "--container" "--network"
             "--nesting" (string-append "--expose=" %deno-dir)
             "-m" "manifest.scm" "--" "bash" "-c"
             (string-append "'export PATH=" %deno-dir ":$PATH && "
                            "export TERM=xterm-256color && exec bash'"))))

(define (dev)
    "Watch the site and rebuild on changes."
    ($ '("deno" "task" "serve")))

(define (serve)
    "Serve the built site with Lume's production server."
    ($ '("deno" "task" "start")))

(define (build)
    "Build the Lume site into output/."
    ($ '("deno" "task" "build")))

(define (ci)
    "Run the CI, nyc doctor plus deno check/lint/fmt/test."
    ($ '("bin/nyc" "doctor"))
    ($ '("deno" "check"))
    ($ '("deno" "lint"))
    ($ '("deno" "fmt" "--check"))
    ($ '("deno" "test")))

(define (fmt)
    "Format the repository source with deno fmt."
    ($ '("deno" "fmt")))

(define (lint)
    "Lint the Perl sources with perlcritic."
    ($ '("perlcritic" "--statistics" "genmail.pl" "build-system/help.pl")))

(define (image)
    "Build the runtime podman image for this site."
    ($ '("podman" "build" "-t" %image-tag ".")))

(define (compose-up)
    "Bring up the podman compose services."
    ($ '("podman" "compose" "up" "-d")))

(define (compose-down)
    "Take down the podman compose services."
    ($ '("podman" "compose" "down")))

(define (compose-restart)
    "Restart the podman compose services."
    (compose-down)
    (compose-up))

(define (oci-run)
    "Run the built image locally on port 8000."
    ($ '("podman" "run" "--rm" "-p" "8000:8000"
         "-e" "URUTAU_PORT=8000" %image-tag)))

(define (push-image)
    "Push the OCI image to the registry (no TLS verify)."
    ($ '("podman" "push" "--tls-verify=false" %image-tag)))
;;; maak.scm ends here.
