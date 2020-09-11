module.exports = (_Current_LSB) => {
  var _m_c, _R_c;

  _R_c = 1;

  _m_c = 1 / _Current_LSB;

  // Calculate m and R for maximum accuracy in current measurement
  var aux = parseInt(_m_c);
  while((aux > 32768) || (aux < -32768)) {
    _m_c = _m_c / 10;
    _R_c = _R_c + 1;
    aux = parseInt(_m_c);
  }

  var round_done = false;

  while(round_done === false) {
    aux = parseInt(_m_c);

    if(aux == _m_c) {
      round_done = true;
    } else {
      aux = parseInt(_m_c * 10);
      if((aux > 32768) || (aux < -32768)) {
        round_done = true;
      } else {
        _m_c = _m_c * 10;
        _R_c = _R_c - 1;
      }
    }
  }

  _m_c = parseInt(_m_c);

  _R_c = -1;

  return {
    _R_c: _R_c,
    _m_c: _m_c
  }
};
