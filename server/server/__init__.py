"""
Project-level runtime patches.

This patch works around a Django 4.2 + Python 3.14 incompatibility where
django.template.context.BaseContext.__copy__ uses copy(super()), which fails
on Python 3.14 and breaks Django admin changelist pages.
"""

from copy import copy as _copy

import django
from django.template.context import BaseContext


def _patched_basecontext_copy(self):
    duplicate = object.__new__(self.__class__)
    duplicate.__dict__ = self.__dict__.copy()
    duplicate.dicts = self.dicts[:]
    return duplicate


if django.VERSION[:2] == (4, 2):
    # Safe no-op on repeated imports.
    BaseContext.__copy__ = _patched_basecontext_copy
